import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { clientsApi } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FREE_TIER_LIMITS } from '../config/constants';

type Client = Database['public']['Tables']['clients']['Row'];

export const useClients = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientsApi.getAll();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchClients();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('clients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
        },
        () => {
          // Refetch when any change occurs
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    refresh: fetchClients,
  };
};
