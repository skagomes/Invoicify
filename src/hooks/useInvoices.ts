import { useState, useEffect, useCallback } from 'react';
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
  const [invoices, setInvoices] = useState<InvoiceWithLineItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch invoices (with optional loading state)
  const fetchInvoices = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      if (showLoading) {
        toast.error('Failed to load invoices');
      }
      console.error('Error fetching invoices:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInvoices(true); // Show loading on initial fetch
  }, [fetchInvoices]);

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
          filter: `user_id=eq.${user.id}`, // ✅ Only listen to current user's invoices
        },
        async () => {
          try {
            await fetchInvoices(false);
          } catch (error) {
            console.error('Real-time sync error (invoices):', error);
          }
        }
      )
      // ❌ REMOVED: invoice_line_items subscription (thundering herd problem)
      // Line item changes trigger invoice updates via updated_at, so the invoices
      // subscription above will catch all changes automatically
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchInvoices]);

  // Check if user can add more invoices (free tier limit)
  const canAddInvoice = async () => {
    if (profile?.subscription_tier === 'pro') {
      return true;
    }
    const count = await invoicesApi.getCountThisMonth();
    return count < FREE_TIER_LIMITS.MAX_INVOICES_PER_MONTH;
  };

  // Add invoice with limit check
  const addInvoice = async (
    invoice: Omit<InvoiceInsert, 'user_id' | 'invoice_number'>,
    lineItems: Omit<InvoiceLineItemInsert, 'invoice_id'>[]
  ) => {
    const canAdd = await canAddInvoice();
    if (!canAdd) {
      toast.error(`Free tier limit: Maximum ${FREE_TIER_LIMITS.MAX_INVOICES_PER_MONTH} invoices per month. Upgrade for unlimited!`);
      return null;
    }

    try {
      const newInvoice = await invoicesApi.create(invoice, lineItems);

      // Optimistic update: Immediately add to local state
      setInvoices(prev => [newInvoice, ...prev]);

      toast.success('Invoice created successfully');
      return newInvoice;
    } catch (err) {
      toast.error('Failed to create invoice');
      console.error('Error creating invoice:', err);
      throw err;
    }
  };

  // Update invoice
  const updateInvoice = async (
    id: string,
    updates: Partial<InvoiceInsert>,
    lineItems?: Omit<InvoiceLineItemInsert, 'invoice_id'>[]
  ) => {
    try {
      const updated = await invoicesApi.update(id, updates, lineItems);

      // Optimistic update: Immediately replace in local state
      setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));

      toast.success('Invoice updated successfully');
      return updated;
    } catch (err) {
      toast.error('Failed to update invoice');
      console.error('Error updating invoice:', err);
      throw err;
    }
  };

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    try {
      await invoicesApi.delete(id);

      // Optimistic update: Immediately remove from local state
      setInvoices(prev => prev.filter(inv => inv.id !== id));

      toast.success('Invoice deleted successfully');
    } catch (err) {
      toast.error('Failed to delete invoice');
      console.error('Error deleting invoice:', err);
      throw err;
    }
  };

  // Duplicate invoice
  const duplicateInvoice = async (id: string) => {
    const canAdd = await canAddInvoice();
    if (!canAdd) {
      toast.error(`Free tier limit: Maximum ${FREE_TIER_LIMITS.MAX_INVOICES_PER_MONTH} invoices per month. Upgrade for unlimited!`);
      return null;
    }

    try {
      const original = await invoicesApi.getById(id);

      const newInvoice = await invoicesApi.create(
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

      // Optimistic update: Immediately add to local state
      setInvoices(prev => [newInvoice, ...prev]);

      toast.success('Invoice duplicated successfully');
      return newInvoice;
    } catch (err) {
      toast.error('Failed to duplicate invoice');
      console.error('Error duplicating invoice:', err);
      throw err;
    }
  };

  return {
    invoices,
    loading,
    error,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    refresh: () => fetchInvoices(true),
  };
};
