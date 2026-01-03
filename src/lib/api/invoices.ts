import { supabase } from '../supabase';
import type { Database } from '../../types/database';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
type InvoiceLineItem = Database['public']['Tables']['invoice_line_items']['Row'];
type InvoiceLineItemInsert = Database['public']['Tables']['invoice_line_items']['Insert'];

// Extended invoice type with line items
export interface InvoiceWithLineItems extends Invoice {
  line_items: InvoiceLineItem[];
}

export const invoicesApi = {
  // Get all invoices for the current user with line items (with pagination)
  async getAll(options?: { page?: number; pageSize?: number }) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: data as InvoiceWithLineItems[],
      count: count || 0,
    };
  },

  // Get a single invoice by ID with line items
  async getById(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as InvoiceWithLineItems;
  },

  // Get invoices for a specific client
  async getByClientId(clientId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as InvoiceWithLineItems[];
  },

  // Create a new invoice with line items
  async create(
    invoice: Omit<InvoiceInsert, 'user_id' | 'invoice_number'>,
    lineItems: Omit<InvoiceLineItemInsert, 'invoice_id'>[]
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the next invoice number
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = existingInvoices?.[0]?.invoice_number
      ? parseInt(existingInvoices[0].invoice_number.split('-')[1] || '0')
      : 0;
    const newInvoiceNumber = `INV-${(lastNumber + 1).toString().padStart(4, '0')}`;

    // Create invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        user_id: user.id,
        invoice_number: newInvoiceNumber,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create line items
    const { data: lineItemsData, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(
        lineItems.map(item => ({
          ...item,
          invoice_id: invoiceData.id,
        }))
      )
      .select();

    if (lineItemsError) throw lineItemsError;

    return {
      ...invoiceData,
      line_items: lineItemsData,
    } as InvoiceWithLineItems;
  },

  // Update an invoice and its line items
  async update(
    id: string,
    updates: InvoiceUpdate,
    lineItems?: Omit<InvoiceLineItemInsert, 'invoice_id'>[]
  ) {
    // Update invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // If line items are provided, replace them
    if (lineItems) {
      // Delete existing line items
      const { error: deleteError } = await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteError) throw deleteError;

      // Insert new line items
      const { data: lineItemsData, error: insertError } = await supabase
        .from('invoice_line_items')
        .insert(
          lineItems.map(item => ({
            ...item,
            invoice_id: id,
          }))
        )
        .select();

      if (insertError) throw insertError;

      return {
        ...invoiceData,
        line_items: lineItemsData,
      } as InvoiceWithLineItems;
    }

    // Fetch existing line items
    const { data: existingLineItems } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', id);

    return {
      ...invoiceData,
      line_items: existingLineItems || [],
    } as InvoiceWithLineItems;
  },

  // Delete an invoice (line items cascade via DB constraints)
  async delete(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get invoice count for current month (for free tier limits)
  async getCountThisMonth() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;
    return count || 0;
  },
};
