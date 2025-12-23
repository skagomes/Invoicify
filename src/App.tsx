
import React, { useState, useEffect } from 'react';
import { Client, Invoice, Settings, View } from './types';
import { defaultSettings, sampleClients, sampleInvoices } from './lib/data';
import Dashboard from './components/dashboard/Dashboard';
import ClientsPage from './components/clients/ClientsPage';
import InvoicesPage from './components/invoices/InvoicesPage';
import SettingsPage from './components/settings/SettingsPage';
import { FileText, Users, LayoutDashboard, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LanguageProvider, useTranslation } from './lib/i18n';

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useLocalStorage<Client[]>('clients', sampleClients);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', sampleInvoices);
  const [settings, setSettings] = useLocalStorage<Settings>('settings', defaultSettings);
  const [view, setView] = useState<View>({ page: 'dashboard' });
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
      setView({ page: 'invoices' });
    }
  };

  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
  };
  
  const handleSetView = (newView: View) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  }

  const renderView = () => {
    switch (view.page) {
      case 'dashboard':
        return <Dashboard clients={clients} invoices={invoices} settings={settings} />;
      case 'clients':
      case 'clientDetail':
        return <ClientsPage 
          clients={clients} 
          invoices={invoices}
          view={view} 
          setView={handleSetView}
          addClient={addClient}
          updateClient={updateClient}
          deleteClient={deleteClient}
          settings={settings}
        />;
      case 'invoices':
      case 'invoiceForm':
      case 'invoiceView':
        return <InvoicesPage
          invoices={invoices}
          clients={clients}
          settings={settings}
          view={view}
          setView={handleSetView}
          addInvoice={addInvoice}
          updateInvoice={updateInvoice}
          deleteInvoice={deleteInvoice}
          duplicateInvoice={duplicateInvoice}
        />;
      case 'settings':
        return <SettingsPage settings={settings} setSettings={setSettings} />;
      default:
        return <Dashboard clients={clients} invoices={invoices} settings={settings} />;
    }
  };
  
  const NavItem: React.FC<{ icon: React.ReactNode; label: string; page: View['page']; }> = ({ icon, label, page }) => {
    const activePrefix = page.replace(/s$/, '');
    const isActive = view.page.startsWith(activePrefix);
    return (
      <button onClick={() => handleSetView({ page } as View)} className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? 'bg-[var(--color-primary)] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
        {icon}
        <span className="ml-4">{label}</span>
      </button>
    );
  };
  
  const Sidebar: React.FC = () => (
    <aside className="print-hidden hidden md:flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-white border-r rtl:border-r-0 rtl:border-l dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-center mb-8">
         {settings.logo ? (
            <img src={settings.logo} alt="Company Logo" className="h-10 object-contain" />
          ) : (
            <h1 className="text-2xl font-bold text-[var(--color-primary)]">{settings.companyName || 'Invoicify'}</h1>
          )}
      </div>
      <nav className="flex flex-col flex-1 space-y-2">
        <NavItem icon={<LayoutDashboard size={20} />} label={t('dashboard')} page="dashboard" />
        <NavItem icon={<FileText size={20} />} label={t('invoices')} page="invoices" />
        <NavItem icon={<Users size={20} />} label={t('clients')} page="clients" />
        <NavItem icon={<SettingsIcon size={20} />} label={t('settings')} page="settings" />
      </nav>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
       <div className="flex flex-col flex-1">
        <header className="print-hidden md:hidden flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center">
            {settings.logo ? (
              <img src={settings.logo} alt="Company Logo" className="h-8 object-contain" />
            ) : (
              <h1 className="text-xl font-bold text-[var(--color-primary)]">{settings.companyName || 'Invoicify'}</h1>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="text-gray-600 dark:text-gray-300"/> : <Menu className="text-gray-600 dark:text-gray-300"/>}
          </button>
        </header>

        {isMobileMenuOpen && (
          <nav className="print-hidden md:hidden p-4 bg-white dark:bg-gray-800 space-y-2">
            <NavItem icon={<LayoutDashboard size={20} />} label={t('dashboard')} page="dashboard" />
            <NavItem icon={<FileText size={20} />} label={t('invoices')} page="invoices" />
            <NavItem icon={<Users size={20} />} label={t('clients')} page="clients" />
            <NavItem icon={<SettingsIcon size={20} />} label={t('settings')} page="settings" />
          </nav>
        )}
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
