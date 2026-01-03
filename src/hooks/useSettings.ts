import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Settings = Database['public']['Tables']['settings']['Row'];
type SettingsUpdate = Database['public']['Tables']['settings']['Update'];

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch settings
  // isInitial: true = show loading spinner, false = background refresh
  const fetchSettings = useCallback(async (isInitial: boolean = true) => {
    try {
      // Only show loading spinner on initial load, not on background refreshes
      if (isInitial) {
        setLoading(true);
      }
      setError(null); // Clear previous errors

      const data = await settingsApi.get();

      // If no settings exist, rely on the database trigger 'handle_new_user' to create them.
      // Don't attempt client-side creation to avoid race conditions and duplicate key errors.
      if (!data) {
        console.warn('No settings found. The database trigger should create them automatically.');
        // Set to null and let MainApp show the error/retry view
        setSettings(null);
        setError(new Error('Settings not found. Please refresh the page or contact support if the issue persists.'));
      } else {
        setSettings(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      const error = err as Error;

      // Check if user is not authenticated
      if (error.message === 'Not authenticated') {
        console.warn('User not authenticated - clearing settings');
        setSettings(null);
        setError(null); // Don't show error for unauthenticated users
      } else if (error.message.includes('JSON') || error.message.includes('fetch') || error.message.includes('network')) {
        // Network issues - fail silently with console warning only
        console.warn('Network issue loading settings:', error.message);
        setError(null);
      } else {
        // Critical logic failure - show error
        setError(error);
        if (isInitial) {
          toast.error('Failed to load settings. Please try refreshing the page.');
        }
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch with loading spinner
  useEffect(() => {
    fetchSettings(true);
  }, [fetchSettings]);

  // Update settings
  const updateSettings = async (updates: SettingsUpdate) => {
    try {
      const updated = await settingsApi.update(updates);
      setSettings(updated);
      toast.success('Settings updated successfully');
      return updated;
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings');
      throw err;
    }
  };

  // Upload logo
  const uploadLogo = async (file: File) => {
    try {
      const updated = await settingsApi.uploadLogo(file);
      setSettings(updated);
      toast.success('Logo uploaded successfully');
      return updated;
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast.error('Failed to upload logo');
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadLogo,
    refresh: () => fetchSettings(false), // Background refresh without loading spinner
  };
};
