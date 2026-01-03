import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from '../dashboard/Dashboard';
import ClientsPage from '../clients/ClientsPage';
import InvoicesPage from '../invoices/InvoicesPage';
import SettingsPage from '../settings/SettingsPage';
import { NotFoundPage } from '../NotFoundPage';
import { FileText, Users, LayoutDashboard, Settings as SettingsIcon, Menu, X, LogOut } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useClients } from '../../hooks/useClients';
import { useInvoices } from '../../hooks/useInvoices';
import { useSettings } from '../../hooks/useSettings';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import type { View } from '../../types';

export const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // View state management for internal navigation
  const [clientsView, setClientsView] = useState<View>({ page: 'clients' });
  const [invoicesView, setInvoicesView] = useState<View>({ page: 'invoices' });

  // Use Supabase hooks for data
  const { clients, addClient, updateClient, deleteClient, canAddClient } = useClients();
  const { invoices, addInvoice, updateInvoice, deleteInvoice, duplicateInvoice } = useInvoices();
  const { settings, loading: settingsLoading, error: settingsError, updateSettings, uploadLogo } = useSettings();

  // Apply custom colors
  useEffect(() => {
    if (settings) {
      const style = document.createElement('style');
      style.innerHTML = `
        :root {
          --color-primary: ${settings.primary_color || '#4f46e5'};
          --color-secondary: ${settings.secondary_color || '#ec4899'};
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [settings?.primary_color, settings?.secondary_color]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      // Navigate to login page explicitly
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      // Still try to navigate to login even if there's an error
      navigate('/login', { replace: true });
    }
  };

  const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => (
    <NavLink
      to={to}
      onClick={() => {
        setIsMobileMenuOpen(false);
        onClick?.();
      }}
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
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="Company Logo" className="h-10 object-contain" />
        ) : (
          <h1 className="text-2xl font-bold text-primary-600">{settings?.company_name || 'Invoicify'}</h1>
        )}
      </div>

      <nav className="flex flex-col flex-1 space-y-2">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label={t('dashboard')} />
        <NavItem to="/invoices" icon={<FileText size={20} />} label={t('invoices')} onClick={() => setInvoicesView({ page: 'invoices' })} />
        <NavItem to="/clients" icon={<Users size={20} />} label={t('clients')} onClick={() => setClientsView({ page: 'clients' })} />
        <NavItem to="/settings" icon={<SettingsIcon size={20} />} label={t('settings')} />
      </nav>

      <div className="pt-4 mt-4 border-t dark:border-gray-700">
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 truncate">{user?.email || profile?.email}</p>
          {profile?.subscription_tier && (
            <span className={clsx(
              'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded',
              profile.subscription_tier === 'pro'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700'
            )}>
              {profile.subscription_tier === 'pro' ? 'Pro' : 'Free'}
            </span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
        >
          <LogOut size={20} />
          <span className="ml-4">Sign Out</span>
        </button>
      </div>
    </aside>
  );

  // Show loading state while settings load
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if settings failed to load
  if (settingsError || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Failed to Load Settings</h2>
            <p className="text-red-700 mb-4">
              {settingsError?.message || 'Unable to load your account settings. This may be due to a database issue.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        {/* Mobile Header */}
        <header className="print-hidden md:hidden flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Company Logo" className="h-8 object-contain" />
            ) : (
              <h1 className="text-xl font-bold text-primary-600">{settings.company_name || 'Invoicify'}</h1>
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
            <NavItem to="/invoices" icon={<FileText size={20} />} label={t('invoices')} onClick={() => setInvoicesView({ page: 'invoices' })} />
            <NavItem to="/clients" icon={<Users size={20} />} label={t('clients')} onClick={() => setClientsView({ page: 'clients' })} />
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
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  clients={clients.map(c => ({ ...c, id: c.id, vatNumber: c.vat_number || '' }))}
                  invoices={invoices.map(inv => ({
                    ...inv,
                    id: inv.id,
                    clientId: inv.client_id,
                    invoiceNumber: inv.invoice_number,
                    issueDate: inv.issue_date,
                    dueDate: inv.due_date,
                    taxRate: Number(inv.tax_rate),
                    status: inv.status as 'Pending' | 'Paid',
                    lineItems: inv.line_items.map(li => ({
                      id: li.id,
                      description: li.description,
                      quantity: li.quantity,
                      rate: Number(li.rate),
                    })),
                  }))}
                  settings={{
                    companyName: settings.company_name || '',
                    companyEmail: settings.company_email || '',
                    companyAddress: settings.company_address || '',
                    companyVAT: settings.company_vat_number || '',
                    logo: settings.logo_url || '',
                    primaryColor: settings.primary_color,
                    secondaryColor: settings.secondary_color,
                    currencySymbol: settings.currency_symbol,
                    defaultTaxRate: Number(settings.default_tax_rate),
                    language: settings.language as 'en' | 'fr',
                  }}
                />
              }
            />
            <Route
              path="/clients/*"
              element={
                <ClientsPage
                  clients={clients.map(c => ({ ...c, id: c.id, vatNumber: c.vat_number || '' }))}
                  invoices={invoices.map(inv => ({
                    ...inv,
                    id: inv.id,
                    clientId: inv.client_id,
                    invoiceNumber: inv.invoice_number,
                    issueDate: inv.issue_date,
                    dueDate: inv.due_date,
                    taxRate: Number(inv.tax_rate),
                    status: inv.status as 'Pending' | 'Paid',
                    lineItems: inv.line_items.map(li => ({
                      id: li.id,
                      description: li.description,
                      quantity: li.quantity,
                      rate: Number(li.rate),
                    })),
                  }))}
                  view={clientsView}
                  setView={setClientsView}
                  addClient={async (client) => {
                    await addClient({
                      name: client.name,
                      email: client.email,
                      address: client.address,
                      vat_number: client.vatNumber,
                    });
                  }}
                  updateClient={async (client) => {
                    await updateClient(client.id, {
                      name: client.name,
                      email: client.email,
                      address: client.address,
                      vat_number: client.vatNumber,
                    });
                  }}
                  deleteClient={deleteClient}
                  settings={{
                    companyName: settings.company_name || '',
                    companyEmail: settings.company_email || '',
                    companyAddress: settings.company_address || '',
                    companyVAT: settings.company_vat_number || '',
                    logo: settings.logo_url || '',
                    primaryColor: settings.primary_color,
                    secondaryColor: settings.secondary_color,
                    currencySymbol: settings.currency_symbol,
                    defaultTaxRate: Number(settings.default_tax_rate),
                    language: settings.language as 'en' | 'fr',
                  }}
                />
              }
            />
            <Route
              path="/invoices/*"
              element={
                <InvoicesPage
                  invoices={invoices.map(inv => ({
                    ...inv,
                    id: inv.id,
                    clientId: inv.client_id,
                    invoiceNumber: inv.invoice_number,
                    issueDate: inv.issue_date,
                    dueDate: inv.due_date,
                    taxRate: Number(inv.tax_rate),
                    status: inv.status as 'Pending' | 'Paid',
                    lineItems: inv.line_items.map(li => ({
                      id: li.id,
                      description: li.description,
                      quantity: li.quantity,
                      rate: Number(li.rate),
                    })),
                  }))}
                  clients={clients.map(c => ({ ...c, id: c.id, vatNumber: c.vat_number || '' }))}
                  settings={{
                    companyName: settings.company_name || '',
                    companyEmail: settings.company_email || '',
                    companyAddress: settings.company_address || '',
                    companyVAT: settings.company_vat_number || '',
                    logo: settings.logo_url || '',
                    primaryColor: settings.primary_color,
                    secondaryColor: settings.secondary_color,
                    currencySymbol: settings.currency_symbol,
                    defaultTaxRate: Number(settings.default_tax_rate),
                    language: settings.language as 'en' | 'fr',
                  }}
                  view={invoicesView}
                  setView={setInvoicesView}
                  addInvoice={async (invoice) => {
                    return await addInvoice(
                      {
                        client_id: invoice.clientId,
                        issue_date: invoice.issueDate,
                        due_date: invoice.dueDate,
                        tax_rate: invoice.taxRate,
                        status: invoice.status,
                      },
                      invoice.lineItems.map(li => ({
                        description: li.description,
                        quantity: li.quantity,
                        rate: li.rate,
                      }))
                    );
                  }}
                  updateInvoice={async (invoice) => {
                    return await updateInvoice(
                      invoice.id,
                      {
                        client_id: invoice.clientId,
                        issue_date: invoice.issueDate,
                        due_date: invoice.dueDate,
                        tax_rate: invoice.taxRate,
                        status: invoice.status,
                      },
                      invoice.lineItems.map(li => ({
                        description: li.description,
                        quantity: li.quantity,
                        rate: li.rate,
                      }))
                    );
                  }}
                  deleteInvoice={deleteInvoice}
                  duplicateInvoice={duplicateInvoice}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  settings={{
                    companyName: settings.company_name || '',
                    companyEmail: settings.company_email || '',
                    companyAddress: settings.company_address || '',
                    companyVAT: settings.company_vat_number || '',
                    logo: settings.logo_url || '',
                    primaryColor: settings.primary_color,
                    secondaryColor: settings.secondary_color,
                    currencySymbol: settings.currency_symbol,
                    defaultTaxRate: Number(settings.default_tax_rate),
                    language: settings.language as 'en' | 'fr',
                  }}
                  setSettings={async (newSettings) => {
                    if (typeof newSettings === 'function') {
                      const updated = newSettings({
                        companyName: settings.company_name || '',
                        companyEmail: settings.company_email || '',
                        companyAddress: settings.company_address || '',
                        companyVAT: settings.company_vat_number || '',
                        logo: settings.logo_url || '',
                        primaryColor: settings.primary_color,
                        secondaryColor: settings.secondary_color,
                        currencySymbol: settings.currency_symbol,
                        defaultTaxRate: Number(settings.default_tax_rate),
                        language: settings.language as 'en' | 'fr',
                      });
                      await updateSettings({
                        company_name: updated.companyName,
                        company_email: updated.companyEmail,
                        company_address: updated.companyAddress,
                        company_vat_number: updated.companyVAT,
                        primary_color: updated.primaryColor,
                        secondary_color: updated.secondaryColor,
                        currency_symbol: updated.currencySymbol,
                        default_tax_rate: updated.defaultTaxRate,
                        language: updated.language,
                      });
                    }
                  }}
                />
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* 404 Page - Must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
