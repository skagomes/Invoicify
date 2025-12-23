import { useState, useEffect } from 'react';
import { settingsApi } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Settings = Database['public']['Tables']['settings']['Row'];
type SettingsUpdate = Database['public']['Tables']['settings']['Update'];

const DEFAULT_SETTINGS: Partial<Settings> = {
  company_name: '',
  company_email: '',
  company_address: '',
  company_vat_number: '',
  logo_url: null,
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  currency_symbol: '$',
  default_tax_rate: 20,
  language: 'en',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.get();

      // If no settings exist, create default ones
      if (!data) {
        const created = await settingsApi.create(DEFAULT_SETTINGS);
        setSettings(created);
      } else {
        setSettings(data);
      }

      setError(null);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update settings
  const updateSettings = async (updates: SettingsUpdate) => {
    try {
      const updated = await settingsApi.update(updates);
      setSettings(updated);
      toast.success('Settings updated successfully');
      return updated;
    } catch (err) {
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
    refresh: fetchSettings,
  };
};
