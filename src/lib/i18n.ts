
import React, { createContext, useContext, useCallback, PropsWithChildren } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Language = 'en' | 'fr';
type Translations = { [key: string]: string };
type TranslationObject = { [L in Language]: Translations };

const translations: TranslationObject = {
  en: {
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    clients: 'Clients',
    settings: 'Settings',
    totalRevenue: 'Total Revenue',
    pendingInvoices: 'Pending Invoices',
    totalClients: 'Total Clients',
    recentInvoices: 'Recent Invoices',
    invoiceNumber: 'Invoice #',
    client: 'Client',
    dueDate: 'Due Date',
    status: 'Status',
    amount: 'Amount',
    addClient: 'Add Client',
    searchClients: 'Search clients...',
    name: 'Name',
    email: 'Email',
    address: 'Address',
    actions: 'Actions',
    editClient: 'Edit Client',
    addNewClient: 'Add New Client',
    saveClient: 'Save Client',
    cancel: 'Cancel',
    deleteClient: 'Delete Client',
    confirmDeleteClient: 'Are you sure you want to delete this client and all their invoices?',
    lifetimeRevenue: 'Lifetime Revenue',
    paidRevenue: 'Paid Revenue',
    invoiceHistory: 'Invoice History',
    view: 'View',
    newInvoice: 'New Invoice',
    searchInvoices: 'Search invoices...',
    all: 'All',
    pending: 'Pending',
    paid: 'Paid',
    edit: 'Edit',
    duplicate: 'Duplicate',
    delete: 'Delete',
    markAsPaid: 'Mark as Paid',
    print: 'Print',
    editInvoice: 'Edit Invoice',
    createNewInvoice: 'Create New Invoice',
    issueDate: 'Issue Date',
    billTo: 'Bill To:',
    description: 'Description',
    quantity: 'Qty',
    rate: 'Rate',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    addLineItem: 'Add Line Item',
    saveInvoice: 'Save Invoice',
    companyInfo: 'Company Information',
    companyName: 'Company Name',
    companyEmail: 'Company Email',
    companyAddress: 'Company Address',
    branding: 'Branding',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    companyLogo: 'Company Logo',
    uploadLogo: 'Upload Logo',
    financials: 'Financials',
    currencySymbol: 'Currency Symbol',
    defaultTaxRate: 'Default Tax Rate (%)',
    language: 'Language',
    vatNumber: 'VAT Number',
    vatLabel: 'VAT',
  },
  fr: {
    dashboard: 'Tableau de bord',
    invoices: 'Factures',
    clients: 'Clients',
    settings: 'Paramètres',
    totalRevenue: 'Revenu total',
    pendingInvoices: 'Factures en attente',
    totalClients: 'Total des clients',
    recentInvoices: 'Factures récentes',
    invoiceNumber: 'Facture n°',
    client: 'Client',
    dueDate: 'Date d\'échéance',
    status: 'Statut',
    amount: 'Montant',
    addClient: 'Ajouter un client',
    searchClients: 'Rechercher des clients...',
    name: 'Nom',
    email: 'E-mail',
    address: 'Adresse',
    actions: 'Actions',
    editClient: 'Modifier le client',
    addNewClient: 'Ajouter un nouveau client',
    saveClient: 'Enregistrer le client',
    cancel: 'Annuler',
    deleteClient: 'Supprimer le client',
    confirmDeleteClient: 'Êtes-vous sûr de vouloir supprimer ce client et toutes ses factures ?',
    lifetimeRevenue: 'Revenu à vie',
    paidRevenue: 'Revenu payé',
    invoiceHistory: 'Historique des factures',
    view: 'Voir',
    newInvoice: 'Nouvelle facture',
    searchInvoices: 'Rechercher des factures...',
    all: 'Toutes',
    pending: 'En attente',
    paid: 'Payée',
    edit: 'Modifier',
    duplicate: 'Dupliquer',
    delete: 'Supprimer',
    markAsPaid: 'Marquer comme payée',
    print: 'Imprimer',
    editInvoice: 'Modifier la facture',
    createNewInvoice: 'Créer une nouvelle facture',
    issueDate: 'Date d\'émission',
    billTo: 'Facturer à :',
    description: 'Description',
    quantity: 'Qté',
    rate: 'Taux',
    total: 'Total',
    subtotal: 'Sous-total',
    tax: 'Taxe',
    addLineItem: 'Ajouter un article',
    saveInvoice: 'Enregistrer la facture',
    companyInfo: 'Informations sur l\'entreprise',
    companyName: 'Nom de l\'entreprise',
    companyEmail: 'E-mail de l\'entreprise',
    companyAddress: 'Adresse de l\'entreprise',
    branding: 'Personnalisation',
    primaryColor: 'Couleur primaire',
    secondaryColor: 'Couleur secondaire',
    companyLogo: 'Logo de l\'entreprise',
    uploadLogo: 'Télécharger le logo',
    financials: 'Finances',
    currencySymbol: 'Symbole monétaire',
    defaultTaxRate: 'Taux de taxe par défaut (%)',
    language: 'Langue',
    vatNumber: 'Numéro de TVA',
    vatLabel: 'TVA',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [language, setLanguage] = useLocalStorage<Language>('language', 'en');

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  // FIX: Replace JSX with React.createElement because this is a .ts file, which prevents JSX parsing errors.
  return React.createElement(LanguageContext.Provider, { value: { language, setLanguage, t } }, children);
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};