
import React from 'react';
import { Client, Invoice, Settings } from '../types';
import { DollarSign, Users, FileText } from 'lucide-react';
import { useTranslation } from '../i18n';

interface DashboardProps {
  clients: Client[];
  invoices: Invoice[];
  settings: Settings;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </div>
);


const Dashboard: React.FC<DashboardProps> = ({ clients, invoices, settings }) => {
  const { t } = useTranslation();
  
  const calculateTotalRevenue = () => {
    return invoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((total, invoice) => {
        const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
        const tax = subtotal * (invoice.taxRate / 100);
        return total + subtotal + tax;
      }, 0);
  };

  const totalRevenue = calculateTotalRevenue();
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'Pending').length;
  const totalClients = clients.length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('dashboard')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<DollarSign className="text-white" size={24} />}
          title={t('totalRevenue')}
          value={`${settings.currencySymbol}${totalRevenue.toFixed(2)}`}
          color="bg-green-500"
        />
        <StatCard
          icon={<FileText className="text-white" size={24} />}
          title={t('pendingInvoices')}
          value={pendingInvoices}
          color="bg-yellow-500"
        />
        <StatCard
          icon={<Users className="text-white" size={24} />}
          title={t('totalClients')}
          value={totalClients}
          color="bg-blue-500"
        />
      </div>
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('recentInvoices')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('invoiceNumber')}</th>
                <th scope="col" className="px-6 py-3">{t('client')}</th>
                <th scope="col" className="px-6 py-3">{t('dueDate')}</th>
                <th scope="col" className="px-6 py-3">{t('status')}</th>
                <th scope="col" className="px-6 py-3">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map(invoice => {
                const client = clients.find(c => c.id === invoice.clientId);
                const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
                const total = subtotal * (1 + invoice.taxRate / 100);
                return (
                  <tr key={invoice.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4">{client?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{invoice.dueDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                        {t(invoice.status.toLowerCase() as 'paid' | 'pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{`${settings.currencySymbol}${total.toFixed(2)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
