import { supabase } from '../supabase';
import type { Database } from '../../types/database';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export const clientsApi = {
  // Get all clients for the current user
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Client[];
  },

  // Get a single client by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Client;
  },

  // Create a new client
  async create(client: Omit<ClientInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  // Update a client
  async update(id: string, updates: ClientUpdate) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  // Delete a client (cascades to invoices via DB constraints)
  async delete(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get client count for free tier limit checking
  async getCount() {
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },
};
