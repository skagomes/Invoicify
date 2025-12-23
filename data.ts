
import { Client, Invoice, Settings } from './types';

export const defaultSettings: Settings = {
  companyName: 'My Company',
  companyEmail: 'contact@mycompany.com',
  companyAddress: '123 Main Street, Anytown, USA 12345',
  logo: null,
  primaryColor: '#4F46E5', // Indigo-600
  secondaryColor: '#EC4899', // Pink-500
  currencySymbol: '$',
  defaultTaxRate: 10,
  companyVat: '',
};

export const sampleClients: Client[] = [
  { id: '1', name: 'Innovate LLC', email: 'contact@innovate.com', address: '456 Tech Park, Silicon Valley, CA 94043', vatNumber: '' },
  { id: '2', name: 'Quantum Solutions', email: 'support@quantum.com', address: '789 Future Ave, Metropolis, NY 10001', vatNumber: '' },
];

export const sampleInvoices: Invoice[] = [
  {
    id: '101',
    invoiceNumber: 'INV-0001',
    clientId: '1',
    issueDate: '2023-10-15',
    dueDate: '2023-11-14',
    lineItems: [
      { id: 'li1', description: 'Web Design Services', quantity: 1, rate: 2500 },
      { id: 'li2', description: 'Hosting (1 year)', quantity: 1, rate: 300 },
    ],
    taxRate: 8.5,
    status: 'Paid',
  },
  {
    id: '102',
    invoiceNumber: 'INV-0002',
    clientId: '2',
    issueDate: '2023-10-20',
    dueDate: '2023-11-19',
    lineItems: [
      { id: 'li3', description: 'Quantum Computing Consultation', quantity: 10, rate: 500 },
    ],
    taxRate: 10,
    status: 'Pending',
  },
];