
import React, { useState, useMemo } from 'react';
import { Client, Invoice, Settings, View } from '../../types';
import { Plus, Search, Trash2, Edit, X, Mail, MapPin, User, ArrowLeft, DollarSign, CheckCircle, Hash } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface ClientsPageProps {
  clients: Client[];
  invoices: Invoice[];
  view: View;
  setView: (view: View) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  onNavigateToInvoice: (id: string) => void;
  settings: Settings;
}

const ClientFormModal: React.FC<{ client?: Client; onSave: (client: Client | Omit<Client, 'id'>) => void; onClose: () => void }> = ({ client, onSave, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    address: client?.address || '',
    vatNumber: client?.vatNumber || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client) {
      onSave({ ...client, ...formData });
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{client ? t('editClient') : t('addNewClient')}</h2>
          <button onClick={onClose}><X className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('name')}</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200" />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('vatNumber')}</label>
            <input type="text" name="vatNumber" value={formData.vatNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('address')}</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200" rows={3}></textarea>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90">{t('saveClient')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientDetail: React.FC<Omit<ClientsPageProps, 'view' | 'addClient' | 'updateClient'> & { clientId: string }> = ({ clientId, clients, invoices, settings, setView, deleteClient, onNavigateToInvoice }) => {
  const { t } = useTranslation();
  const client = clients.find(c => c.id === clientId);
  const clientInvoices = invoices.filter(i => i.clientId === clientId);

  const [lifetimeRevenue, paidRevenue] = useMemo(() => {
    let lifetime = 0;
    let paid = 0;
    clientInvoices.forEach(invoice => {
      const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
      const total = subtotal * (1 + invoice.taxRate / 100);
      lifetime += total;
      if (invoice.status === 'Paid') {
        paid += total;
      }
    });
    return [lifetime, paid];
  }, [clientInvoices]);

  if (!client) return <div>Client not found. <button onClick={() => setView({ page: 'clients' })}>Go back</button></div>;
  
  const handleDelete = () => {
    if(window.confirm(t('confirmDeleteClient'))) {
      deleteClient(client.id);
      setView({ page: 'clients' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => setView({ page: 'clients' })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{client.name}</h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <div className="flex items-center"><User className="mr-3 text-[var(--color-primary)]" size={20} /> <span className="text-gray-700 dark:text-gray-300">{client.name}</span></div>
        <div className="flex items-center"><Mail className="mr-3 text-[var(--color-primary)]" size={20} /> <span className="text-gray-700 dark:text-gray-300">{client.email}</span></div>
        {client.vatNumber && <div className="flex items-center"><Hash className="mr-3 text-[var(--color-primary)]" size={20} /> <span className="text-gray-700 dark:text-gray-300">{t('vatLabel')}: {client.vatNumber}</span></div>}
        <div className="flex items-center"><MapPin className="mr-3 text-[var(--color-primary)]" size={20} /> <span className="text-gray-700 dark:text-gray-300">{client.address}</span></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900"><DollarSign className="text-green-600 dark:text-green-300"/></div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('lifetimeRevenue')}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{settings.currencySymbol}{lifetimeRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900"><CheckCircle className="text-blue-600 dark:text-blue-300"/></div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('paidRevenue')}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{settings.currencySymbol}{paidRevenue.toFixed(2)}</p>
            </div>
          </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('invoiceHistory')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('invoiceNumber')}</th>
                <th scope="col" className="px-6 py-3">{t('dueDate')}</th>
                <th scope="col" className="px-6 py-3">{t('status')}</th>
                <th scope="col" className="px-6 py-3">{t('amount')}</th>
                <th scope="col" className="px-6 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {clientInvoices.map(invoice => {
                const total = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0) * (1 + invoice.taxRate / 100);
                return (
                  <tr key={invoice.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4">{invoice.dueDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                        {t(invoice.status.toLowerCase() as 'paid' | 'pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{`${settings.currencySymbol}${total.toFixed(2)}`}</td>
                     <td className="px-6 py-4">
                      <button onClick={() => onNavigateToInvoice(invoice.id)} className="font-medium text-[var(--color-primary)] hover:underline">{t('view')}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
       <div className="flex justify-end space-x-2 pt-4">
         <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center">
          <Trash2 size={16} className="mr-2"/> {t('deleteClient')}
         </button>
       </div>
    </div>
  );
};


const ClientsPage: React.FC<ClientsPageProps> = (props) => {
  const { view, clients, setView, addClient, updateClient, deleteClient } = props;
  const { t } = useTranslation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddClient = () => {
    setClientToEdit(undefined);
    setIsModalOpen(true);
  };
  
  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  }

  const handleSaveClient = (clientData: Client | Omit<Client, 'id'>) => {
    if ('id' in clientData) {
      updateClient(clientData);
    } else {
      addClient(clientData);
    }
  };
  
  const handleDeleteClient = (clientId: string) => {
    if(window.confirm(t('confirmDeleteClient'))) {
      deleteClient(clientId);
    }
  }

  if (view.page === 'clientDetail') {
    return <ClientDetail clientId={view.id} {...props} />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('clients')}</h1>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            <input
              type="text"
              placeholder={t('searchClients')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button onClick={handleAddClient} className="flex items-center justify-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg shadow hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={20} className="mr-2" /> {t('addClient')}
          </button>
        </div>
      </div>
      
      {isModalOpen && <ClientFormModal client={clientToEdit} onSave={handleSaveClient} onClose={() => setIsModalOpen(false)} />}
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('name')}</th>
                <th scope="col" className="px-6 py-3">{t('email')}</th>
                <th scope="col" className="px-6 py-3">{t('address')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer" onClick={() => setView({ page: 'clientDetail', id: client.id })}>{client.name}</td>
                  <td className="px-6 py-4">{client.email}</td>
                  <td className="px-6 py-4">{client.address}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEditClient(client)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                    <button onClick={() => handleDeleteClient(client.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;