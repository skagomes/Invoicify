
export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  vatNumber: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export type InvoiceStatus = 'Paid' | 'Pending';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  status: InvoiceStatus;
}

export interface Settings {
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  currencySymbol: string;
  defaultTaxRate: number;
  companyVat: string;
}

export type View = 
  | { page: 'dashboard' }
  | { page: 'clients' }
  | { page: 'clientDetail', id: string }
  | { page: 'invoices' }
  | { page: 'invoiceForm', id?: string }
  | { page: 'invoiceView', id: string }
  | { page: 'settings' };