// TypeScript types for Supabase database schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          company_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro';
          subscription_status: string;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro';
          subscription_status?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro';
          subscription_status?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          address: string | null;
          vat_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          address?: string | null;
          vat_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          address?: string | null;
          vat_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          tax_rate: number;
          status: 'Pending' | 'Paid';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          tax_rate?: number;
          status?: 'Pending' | 'Paid';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          invoice_number?: string;
          issue_date?: string;
          due_date?: string;
          tax_rate?: number;
          status?: 'Pending' | 'Paid';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_line_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity: number;
          rate: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          rate?: number;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          company_name: string | null;
          company_email: string | null;
          company_address: string | null;
          company_vat_number: string | null;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          currency_symbol: string;
          default_tax_rate: number;
          language: 'en' | 'fr';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name?: string | null;
          company_email?: string | null;
          company_address?: string | null;
          company_vat_number?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          currency_symbol?: string;
          default_tax_rate?: number;
          language?: 'en' | 'fr';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string | null;
          company_email?: string | null;
          company_address?: string | null;
          company_vat_number?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          currency_symbol?: string;
          default_tax_rate?: number;
          language?: 'en' | 'fr';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
