import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { invoicesApi, type InvoiceWithLineItems } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FREE_TIER_LIMITS } from '../config/constants';

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceLineItemInsert = Database['public']['Tables']['invoice_line_items']['Insert'];

export const useInvoices = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch invoices with React Query and pagination
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<{ data: InvoiceWithLineItems[]; count: number }, Error>({
    queryKey: ['invoices', page],
    queryFn: async () => {
      return await invoicesApi.getAll({ page, pageSize });
    },
  });

  const invoices = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Real-time subscription (user-specific)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`invoices_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          try {
            // Invalidate current page to refetch
            await queryClient.invalidateQueries({ queryKey: ['invoices', page] });
          } catch (error) {
            console.error('Real-time sync error (invoices):', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, page, queryClient]);

  // Pagination controls
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  // Check if user can add more invoices (free tier limit)
  const canAddInvoice = async () => {
    if (profile?.subscription_tier === 'pro') {
      return true;
    }
    const count = await invoicesApi.getCountThisMonth();
    return count < FREE_TIER_LIMITS.MAX_INVOICES_PER_MONTH;
  };

  // Add invoice mutation
  const addInvoiceMutation = useMutation({
    mutationFn: async ({
      invoice,
      lineItems,
    }: {
      invoice: Omit<InvoiceInsert, 'user_id' | 'invoice_number'>;
      lineItems: Omit<InvoiceLineItemInsert, 'invoice_id'>[];
    }) => {
      const canAdd = await canAddInvoice();
      if (!canAdd) {
        throw new Error(
          `Free tier limit: Maximum ${FREE_TIER_LIMITS.MAX_INVOICES_PER_MONTH} invoices per month. Upgrade for unlimited!`
        );
      }
      return await invoicesApi.create(invoice, lineItems);
    },
    onSuccess: async () => {
      // Invalidate all invoice pages to refresh data
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (err) => {
      const error = err as Error;
      toast.error(error.message || 'Failed to create invoice');
      console.error('Error creating invoice:', err);
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
      lineItems,
    }: {
      id: string;
      updates: Partial<InvoiceInsert>;
      lineItems?: Omit<InvoiceLineItemInsert, 'invoice_id'>[];
    }) => {
      return await invoicesApi.update(id, updates, lineItems);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['invoices', page] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<{ data: InvoiceWithLineItems[]; count: number }>(['invoices', page]);

      // Optimistically update
      queryClient.setQueryData<{ data: InvoiceWithLineItems[]; count: number }>(
        ['invoices', page],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(inv => inv.id === id ? { ...inv, ...updates } : inv),
          };
        }
      );

      return { previousData };
    },
    onSuccess: async (updated) => {
      // Update with real data
      queryClient.setQueryData<{ data: InvoiceWithLineItems[]; count: number }>(
        ['invoices', page],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(inv => inv.id === updated.id ? updated : inv),
          };
        }
      );
      toast.success('Invoice updated successfully');
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['invoices', page], context.previousData);
      }
      toast.error('Failed to update invoice');
      console.error('Error updating invoice:', err);
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await invoicesApi.delete(id);
      return id;
    },
    onSuccess: async (_deletedId, _variables) => {
      // Invalidate to refetch and handle pagination
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });

      // Check if we need to go back a page
      const newTotalPages = Math.ceil((totalCount - 1) / pageSize);
      if (page > 1 && page > newTotalPages) {
        setPage(prev => prev - 1);
      }

      toast.success('Invoice deleted successfully');
    },
    onError: (err) => {
      toast.error('Failed to delete invoice');
      console.error('Error deleting invoice:', err);
    },
  });

  // Duplicate invoice mutation
  const duplicateInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const canAdd = await canAddInvoice();
      if (!canAdd) {
        throw new Error(
          `Free tier limit: Maximum ${FREE_TIER_LIMITS.MAX_INVOICES_PER_MONTH} invoices per month. Upgrade for unlimited!`
        );
      }

      const original = await invoicesApi.getById(id);

      return await invoicesApi.create(
        {
          client_id: original.client_id,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: '',
          tax_rate: original.tax_rate,
          status: 'Pending',
          notes: original.notes,
        },
        original.line_items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
        }))
      );
    },
    onSuccess: async () => {
      // Invalidate all pages
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice duplicated successfully');
    },
    onError: (err) => {
      const error = err as Error;
      toast.error(error.message || 'Failed to duplicate invoice');
      console.error('Error duplicating invoice:', err);
    },
  });

  return {
    invoices,
    loading,
    error,
    addInvoice: async (
      invoice: Omit<InvoiceInsert, 'user_id' | 'invoice_number'>,
      lineItems: Omit<InvoiceLineItemInsert, 'invoice_id'>[]
    ) => addInvoiceMutation.mutateAsync({ invoice, lineItems }),
    updateInvoice: async (
      id: string,
      updates: Partial<InvoiceInsert>,
      lineItems?: Omit<InvoiceLineItemInsert, 'invoice_id'>[]
    ) => updateInvoiceMutation.mutateAsync({ id, updates, lineItems }),
    deleteInvoice: deleteInvoiceMutation.mutateAsync,
    duplicateInvoice: duplicateInvoiceMutation.mutateAsync,
    refresh: () => refetch(),
    // Pagination
    page,
    totalPages,
    totalCount,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
  };
};
