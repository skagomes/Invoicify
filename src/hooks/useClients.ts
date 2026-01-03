import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { clientsApi } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FREE_TIER_LIMITS } from '../config/constants';

type Client = Database['public']['Tables']['clients']['Row'];

export const useClients = () => {
  const { profile, user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch clients (with optional loading state)
  const fetchClients = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await clientsApi.getAll();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      if (showLoading) {
        toast.error('Failed to load clients');
      }
      console.error('Error fetching clients:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchClients(true); // Show loading on initial fetch
  }, [fetchClients]);

  // Real-time subscription (user-specific)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`clients_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
          filter: `user_id=eq.${user.id}`, // ✅ Only listen to current user's changes
        },
        async () => {
          // Refetch in background (no loading state)
          try {
            await fetchClients(false);
          } catch (error) {
            console.error('Real-time sync error:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchClients]);

  // Check if user can add more clients (free tier limit)
  const canAddClient = () => {
    if (profile?.subscription_tier === 'pro') {
      return true;
    }
    return clients.length < FREE_TIER_LIMITS.MAX_CLIENTS;
  };

  // Add client with limit check
  const addClient = async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!canAddClient()) {
      toast.error(`Free tier limit: Maximum ${FREE_TIER_LIMITS.MAX_CLIENTS} clients. Upgrade to add more!`);
      return null;
    }

    try {
      const newClient = await clientsApi.create(client);
      toast.success('Client added successfully');
      return newClient;
    } catch (err) {
      toast.error('Failed to add client');
      console.error('Error adding client:', err);
      throw err;
    }
  };

  // Update client
  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const updated = await clientsApi.update(id, updates);
      toast.success('Client updated successfully');
      return updated;
    } catch (err) {
      toast.error('Failed to update client');
      console.error('Error updating client:', err);
      throw err;
    }
  };

  // Delete client
  const deleteClient = async (id: string) => {
    try {
      await clientsApi.delete(id);
      toast.success('Client deleted successfully');
    } catch (err) {
      toast.error('Failed to delete client');
      console.error('Error deleting client:', err);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    canAddClient: canAddClient(),
    refresh: () => fetchClients(true),
  };
};
