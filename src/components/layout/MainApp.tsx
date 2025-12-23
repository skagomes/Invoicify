import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Client, Invoice, Settings } from '../../types';
import { defaultSettings, sampleClients, sampleInvoices } from '../../lib/data';
import Dashboard from '../dashboard/Dashboard';
import ClientsPage from '../clients/ClientsPage';
import InvoicesPage from '../invoices/InvoicesPage';
import SettingsPage from '../settings/SettingsPage';
import { FileText, Users, LayoutDashboard, Settings as SettingsIcon, Menu, X, LogOut } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

export const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const { signOut, user, profile } = useAuth();
  const [clients, setClients] = useLocalStorage<Client[]>('clients', sampleClients);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', sampleInvoices);
  const [settings, setSettings] = useLocalStorage<Settings>('settings', defaultSettings);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --color-primary: ${settings.primaryColor || '#4f46e5'};
        --color-secondary: ${settings.secondaryColor || '#ec4899'};
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [settings.primaryColor, settings.secondaryColor]);

  const addClient = (client: Omit<Client, 'id'>) => {
    setClients(prev => [...prev, { ...client, id: Date.now().toString() }]);
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => (c.id === updatedClient.id ? updatedClient : c)));
  };

  const deleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    setInvoices(prev => prev.filter(i => i.clientId !== clientId));
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const newInvoiceNumber = (Math.max(0, ...invoices.map(i => parseInt(i.invoiceNumber.split('-')[1] || '0'))) + 1).toString().padStart(4, '0');
    setInvoices(prev => [...prev, { ...invoice, id: Date.now().toString(), invoiceNumber: `INV-${newInvoiceNumber}` }]);
  };

  const updateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(i => (i.id === updatedInvoice.id ? updatedInvoice : i)));
  };

  const duplicateInvoice = (invoiceId: string) => {
    const originalInvoice = invoices.find(inv => inv.id === invoiceId);
    if (originalInvoice) {
      const { id, invoiceNumber, issueDate, dueDate, status, ...rest } = originalInvoice;
      const newInvoiceData = {
        ...rest,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'Pending' as 'Pending' | 'Paid',
      };
      addInvoice(newInvoiceData);
    }
  };

  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        clsx(
          'flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        )
      }
    >
      {icon}
      <span className="ml-4">{label}</span>
    </NavLink>
  );

  const Sidebar: React.FC = () => (
    <aside className="print-hidden hidden md:flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-white border-r dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-center mb-8">
        {settings.logo ? (
          <img src={settings.logo} alt="Company Logo" className="h-10 object-contain" />
        ) : (
          <h1 className="text-2xl font-bold text-primary-600">{settings.companyName || 'Invoicify'}</h1>
        )}
      </div>

      <nav className="flex flex-col flex-1 space-y-2">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label={t('dashboard')} />
        <NavItem to="/invoices" icon={<FileText size={20} />} label={t('invoices')} />
        <NavItem to="/clients" icon={<Users size={20} />} label={t('clients')} />
        <NavItem to="/settings" icon={<SettingsIcon size={20} />} label={t('settings')} />
      </nav>

      <div className="pt-4 mt-4 border-t dark:border-gray-700">
        <div className="px-4 py-2 text-xs text-gray-500">
          {user?.email || profile?.email}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="ml-4">Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        {/* Mobile Header */}
        <header className="print-hidden md:hidden flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center">
            {settings.logo ? (
              <img src={settings.logo} alt="Company Logo" className="h-8 object-contain" />
            ) : (
              <h1 className="text-xl font-bold text-primary-600">{settings.companyName || 'Invoicify'}</h1>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="text-gray-600 dark:text-gray-300" /> : <Menu className="text-gray-600 dark:text-gray-300" />}
          </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="print-hidden md:hidden p-4 bg-white dark:bg-gray-800 space-y-2 border-b dark:border-gray-700">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label={t('dashboard')} />
            <NavItem to="/invoices" icon={<FileText size={20} />} label={t('invoices')} />
            <NavItem to="/clients" icon={<Users size={20} />} label={t('clients')} />
            <NavItem to="/settings" icon={<SettingsIcon size={20} />} label={t('settings')} />
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="ml-4">Sign Out</span>
            </button>
          </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard clients={clients} invoices={invoices} settings={settings} />} />
            <Route
              path="/clients/*"
              element={
                <ClientsPage
                  clients={clients}
                  invoices={invoices}
                  view={{ page: 'clients' }}
                  setView={() => {}}
                  addClient={addClient}
                  updateClient={updateClient}
                  deleteClient={deleteClient}
                  settings={settings}
                />
              }
            />
            <Route
              path="/invoices/*"
              element={
                <InvoicesPage
                  invoices={invoices}
                  clients={clients}
                  settings={settings}
                  view={{ page: 'invoices' }}
                  setView={() => {}}
                  addInvoice={addInvoice}
                  updateInvoice={updateInvoice}
                  deleteInvoice={deleteInvoice}
                  duplicateInvoice={duplicateInvoice}
                />
              }
            />
            <Route path="/settings" element={<SettingsPage settings={settings} setSettings={setSettings} />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
