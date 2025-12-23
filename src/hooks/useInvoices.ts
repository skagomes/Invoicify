import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { invoicesApi, type InvoiceWithLineItems } from '../lib/api';
import type { Database } from '../types/database';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FREE_TIER_LIMITS } from '../config/constants';

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceLineItemInsert = Database['public']['Tables']['invoice_line_items']['Insert'];

export const useInvoices = () => {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithLineItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('invoices_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        () => {
          fetchInvoices();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_line_items',
        },
        () => {
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      toast.success('Invoice created successfully');
      return newInvoice;
    } catch (err) {
      toast.error('Failed to create invoice');
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
      toast.success('Invoice updated successfully');
      return updated;
    } catch (err) {
      toast.error('Failed to update invoice');
      throw err;
    }
  };

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    try {
      await invoicesApi.delete(id);
      toast.success('Invoice deleted successfully');
    } catch (err) {
      toast.error('Failed to delete invoice');
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

      toast.success('Invoice duplicated successfully');
      return newInvoice;
    } catch (err) {
      toast.error('Failed to duplicate invoice');
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
    refresh: fetchInvoices,
  };
};
