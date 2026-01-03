import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';

type Settings = Database['public']['Tables']['settings']['Row'];
type SettingsUpdate = Database['public']['Tables']['settings']['Update'];

export const useSettings = () => {
  const queryClient = useQueryClient();

  // Fetch settings with React Query
  const {
    data: settings,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Settings | null, Error>({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const data = await settingsApi.get();

        // If no settings exist, rely on the database trigger 'handle_new_user' to create them.
        if (!data) {
          console.warn('No settings found. The database trigger should create them automatically.');
          throw new Error('Settings not found. Please refresh the page or contact support if the issue persists.');
        }

        return data;
      } catch (err) {
        const error = err as Error;

        // Check if user is not authenticated
        if (error.message === 'Not authenticated') {
          console.warn('User not authenticated - clearing settings');
          return null;
        }

        // Network issues - fail silently with console warning only
        if (error.message.includes('JSON') || error.message.includes('fetch') || error.message.includes('network')) {
          console.warn('Network issue loading settings:', error.message);
          return null;
        }

        // Critical logic failure - rethrow to trigger error state
        console.error('Error in fetchSettings:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on auth errors or network issues
      if (error.message === 'Not authenticated') return false;
      if (error.message.includes('JSON') || error.message.includes('fetch') || error.message.includes('network')) return false;
      // Retry once for other errors
      return failureCount < 1;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: SettingsUpdate) => {
      return await settingsApi.update(updates);
    },
    onSuccess: (updated) => {
      // Update the cache with the new settings
      queryClient.setQueryData(['settings'], updated);
      toast.success('Settings updated successfully');
    },
    onError: (err) => {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings');
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      return await settingsApi.uploadLogo(file);
    },
    onSuccess: (updated) => {
      // Update the cache with the new settings
      queryClient.setQueryData(['settings'], updated);
      toast.success('Logo uploaded successfully');
    },
    onError: (err) => {
      console.error('Error uploading logo:', err);
      toast.error('Failed to upload logo');
    },
  });

  return {
    settings: settings ?? null,
    loading,
    error,
    updateSettings: updateSettingsMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    refresh: () => refetch(),
  };
};
