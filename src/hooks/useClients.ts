import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { clientsApi } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FREE_TIER_LIMITS } from '../config/constants';

type Client = Database['public']['Tables']['clients']['Row'];

export const useClients = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch clients with React Query
  const {
    data: clients = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: async () => {
      return await clientsApi.getAll();
    },
  });

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
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Invalidate and refetch clients in background
          try {
            await queryClient.invalidateQueries({ queryKey: ['clients'] });
          } catch (error) {
            console.error('Real-time sync error:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Check if user can add more clients (free tier limit)
  const canAddClient = () => {
    if (profile?.subscription_tier === 'pro') {
      return true;
    }
    return clients.length < FREE_TIER_LIMITS.MAX_CLIENTS;
  };

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!canAddClient()) {
        throw new Error(`Free tier limit: Maximum ${FREE_TIER_LIMITS.MAX_CLIENTS} clients. Upgrade to add more!`);
      }
      return await clientsApi.create(client);
    },
    onMutate: async (newClient) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clients'] });

      // Snapshot previous value
      const previousClients = queryClient.getQueryData<Client[]>(['clients']);

      // Optimistically update cache
      queryClient.setQueryData<Client[]>(['clients'], (old = []) => [
        { ...newClient, id: 'temp-id', user_id: user?.id || '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Client,
        ...old,
      ]);

      return { previousClients };
    },
    onSuccess: (newClient) => {
      // Replace temp client with real one
      queryClient.setQueryData<Client[]>(['clients'], (old = []) =>
        old.map(client => client.id === 'temp-id' ? newClient : client)
      );
      toast.success('Client added successfully');
    },
    onError: (err, _newClient, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
      const error = err as Error;
      toast.error(error.message || 'Failed to add client');
      console.error('Error adding client:', err);
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      return await clientsApi.update(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<Client[]>(['clients']);

      // Optimistically update
      queryClient.setQueryData<Client[]>(['clients'], (old = []) =>
        old.map(client => client.id === id ? { ...client, ...updates } : client)
      );

      return { previousClients };
    },
    onSuccess: (updated) => {
      // Update with real data
      queryClient.setQueryData<Client[]>(['clients'], (old = []) =>
        old.map(client => client.id === updated.id ? updated : client)
      );
      toast.success('Client updated successfully');
    },
    onError: (err, _variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
      toast.error('Failed to update client');
      console.error('Error updating client:', err);
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await clientsApi.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<Client[]>(['clients']);

      // Optimistically remove
      queryClient.setQueryData<Client[]>(['clients'], (old = []) =>
        old.filter(client => client.id !== id)
      );

      return { previousClients };
    },
    onSuccess: () => {
      toast.success('Client deleted successfully');
    },
    onError: (err, _id, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
      toast.error('Failed to delete client');
      console.error('Error deleting client:', err);
    },
  });

  return {
    clients,
    loading,
    error,
    addClient: addClientMutation.mutateAsync,
    updateClient: async (id: string, updates: Partial<Client>) =>
      updateClientMutation.mutateAsync({ id, updates }),
    deleteClient: deleteClientMutation.mutateAsync,
    canAddClient: canAddClient(),
    refresh: () => refetch(),
  };
};
