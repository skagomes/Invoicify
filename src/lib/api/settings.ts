import { supabase } from '../supabase';
import type { Database } from '../../types/database';

type Settings = Database['public']['Tables']['settings']['Row'];
type SettingsInsert = Database['public']['Tables']['settings']['Insert'];
type SettingsUpdate = Database['public']['Tables']['settings']['Update'];

export const settingsApi = {
  // Get settings for the current user
  async get() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If settings don't exist, return default settings
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Settings;
  },

  // Create settings (should only be called once per user, usually by DB trigger)
  async create(settings: Omit<SettingsInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('settings')
      .insert({
        ...settings,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Settings;
  },

  // Update settings
  async update(updates: SettingsUpdate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Settings;
  },

  // Upload logo to Supabase Storage and update settings
  async uploadLogo(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/logo.${fileExt}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);

    // Update settings with logo URL
    const { data, error } = await supabase
      .from('settings')
      .update({ logo_url: publicUrl })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Settings;
  },
};
