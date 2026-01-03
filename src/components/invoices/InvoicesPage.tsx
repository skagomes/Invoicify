
import React, { useState, useMemo, useEffect } from 'react';
import { Client, Invoice, InvoiceLineItem, Settings, View, InvoiceStatus } from '../../types';
import { Plus, Search, Trash2, Edit, X, ArrowLeft, Download, Copy, MoreVertical } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import toast from 'react-hot-toast';

interface InvoicesPageProps {
  invoices: Invoice[];
  clients: Client[];
  settings: Settings;
  view: View;
  setView: (view: View) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  duplicateInvoice: (invoiceId: string) => void;
  // Pagination
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  nextPage: () => void;
  prevPage: () => void;
}

const InvoiceForm: React.FC<Omit<InvoicesPageProps, 'invoices' | 'view' | 'deleteInvoice' | 'duplicateInvoice' | 'page' | 'totalPages' | 'totalCount' | 'pageSize' | 'nextPage' | 'prevPage'>> = ({ setView, addInvoice, updateInvoice, clients, settings }) => {
    const { t } = useTranslation();
    const invoiceToEdit = (window.history.state?.usr?.invoiceToEdit as Invoice | undefined);
    const invoiceToDuplicate = (window.history.state?.usr?.invoiceToDuplicate as Invoice | undefined);
    
    const getInitialFormData = () => {
        const sourceInvoice = invoiceToEdit || invoiceToDuplicate;
        if(sourceInvoice){
            return {
                ...sourceInvoice,
                issueDate: invoiceToDuplicate ? new Date().toISOString().split('T')[0] : sourceInvoice.issueDate,
                dueDate: invoiceToDuplicate ? new Date().toISOString().split('T')[0] : sourceInvoice.dueDate,
                status: (invoiceToDuplicate ? 'Pending' : sourceInvoice.status) as InvoiceStatus
            };
        }

        return {
            clientId: clients[0]?.id || '',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, rate: 0 }],
            taxRate: settings.defaultTaxRate,
            status: 'Pending' as InvoiceStatus,
        };
    };

    const [invoiceData, setInvoiceData] = useState<Omit<Invoice, 'id' | 'invoiceNumber'> | Invoice>(getInitialFormData());

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: name === 'taxRate' ? parseFloat(value) || 0 : value }));
    };

    const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
        const updatedLineItems = [...invoiceData.lineItems];
        const item = updatedLineItems[index];
        if (field === 'description') {
            item.description = value as string;
        } else {
            const numValue = parseFloat(value as string);
            item[field as 'quantity' | 'rate'] = isNaN(numValue) ? 0 : numValue;
        }
        setInvoiceData(prev => ({ ...prev, lineItems: updatedLineItems }));
    };

    const addLineItem = () => {
        setInvoiceData(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]
        }));
    };

    const removeLineItem = (index: number) => {
        const filteredLineItems = invoiceData.lineItems.filter((_, i) => i !== index);
        setInvoiceData(prev => ({ ...prev, lineItems: filteredLineItems }));
    };

    const subtotal = useMemo(() => invoiceData.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0), [invoiceData.lineItems]);
    const taxAmount = useMemo(() => subtotal * (invoiceData.taxRate / 100), [subtotal, invoiceData.taxRate]);
    const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate clientId
        if (!invoiceData.clientId || invoiceData.clientId.trim() === '') {
            toast.error('Please select a client');
            return;
        }

        // Validate dueDate
        if (!invoiceData.dueDate || invoiceData.dueDate.trim() === '') {
            toast.error('Please select a due date');
            return;
        }

        // Validate line items
        if (invoiceData.lineItems.length === 0) {
            toast.error('Please add at least one line item');
            return;
        }

        // Validate that at least one line item has a description and amount
        const hasValidLineItem = invoiceData.lineItems.some(
            item => item.description.trim() !== '' && item.quantity > 0 && item.rate > 0
        );

        if (!hasValidLineItem) {
            toast.error('Please add at least one line item with description, quantity, and rate');
            return;
        }

        try {
            if ('id' in invoiceData) {
                // Update existing invoice
                await updateInvoice(invoiceData as Invoice);
                // Navigate to the updated invoice view
                setView({ page: 'invoiceView', id: invoiceData.id });
            } else {
                // Create new invoice
                const createdInvoice = await addInvoice(invoiceData);

                // Navigate to the created invoice view (or back to list if creation failed)
                if (createdInvoice && createdInvoice.id) {
                    setView({ page: 'invoiceView', id: createdInvoice.id });
                } else {
                    // If creation failed or returned null (e.g., tier limit), stay on form
                    // The error is already shown via toast
                    return;
                }
            }
        } catch (err) {
            console.error('Error saving invoice:', err);
            // Error is already handled by the hooks with toast notifications
            // Stay on the form so user can fix issues
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center space-x-4">
                <button type="button" onClick={() => setView({ page: 'invoices' })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{invoiceToEdit ? `${t('editInvoice')} #${invoiceToEdit.invoiceNumber}` : t('createNewInvoice')}</h1>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('client')}</label>
                    <select name="clientId" value={invoiceData.clientId} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200">
                        <option value="">Select a client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('issueDate')}</label>
                    <input type="date" name="issueDate" value={invoiceData.issueDate} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('dueDate')}</label>
                    <input type="date" name="dueDate" value={invoiceData.dueDate} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200" />
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-left">
                            <tr className="text-sm text-gray-600 dark:text-gray-400">
                                <th className="pb-2 font-medium w-1/2">{t('description')}</th>
                                <th className="pb-2 font-medium">{t('quantity')}</th>
                                <th className="pb-2 font-medium">{t('rate')}</th>
                                <th className="pb-2 font-medium text-right">{t('total')}</th>
                                <th className="pb-2 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceData.lineItems.map((item, index) => (
                                <tr key={item.id}>
                                    <td><input type="text" value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} placeholder="Item description" className="w-full p-2 border-b dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:border-[var(--color-primary)]" /></td>
                                    <td><input type="number" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} className="w-20 p-2 border-b dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:border-[var(--color-primary)]" /></td>
                                    <td><input type="number" value={item.rate} onChange={(e) => handleLineItemChange(index, 'rate', e.target.value)} className="w-24 p-2 border-b dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:border-[var(--color-primary)]" /></td>
                                    <td className="p-2 text-right text-gray-800 dark:text-gray-200">{settings.currencySymbol}{(item.quantity * item.rate).toFixed(2)}</td>
                                    <td><button type="button" onClick={() => removeLineItem(index)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" onClick={addLineItem} className="mt-4 flex items-center px-4 py-2 text-sm text-[var(--color-primary)] font-semibold border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Plus size={16} className="mr-2" /> {t('addLineItem')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2"></div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                        <span>{t('subtotal')}</span>
                        <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <span className="text-gray-600 dark:text-gray-300">{t('tax')} (%)</span>
                            <input type="number" step="0.01" name="taxRate" value={invoiceData.taxRate} onChange={handleInputChange} className="ml-2 w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-300">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t dark:border-gray-600 my-2"></div>
                    <div className="flex justify-between items-center text-xl font-bold text-gray-800 dark:text-gray-100">
                        <span>{t('total')}</span>
                        <span>{settings.currencySymbol}{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setView({ page: 'invoices' })} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                <button type="submit" className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90">{t('saveInvoice')}</button>
            </div>
        </form>
    );
};

const InvoiceView: React.FC<Omit<InvoicesPageProps, 'view' | 'addInvoice' | 'duplicateInvoice'>> = ({ setView, updateInvoice, deleteInvoice, invoices, clients, settings }) => {
    const { t } = useTranslation();
    const invoiceId = (window.history.state?.usr?.invoiceId as string);
    const invoice = invoices.find(i => i.id === invoiceId);
    const client = clients.find(c => c.id === invoice?.clientId);

    if (!invoice || !client) {
        return <div>Invoice not found. <button onClick={() => setView({ page: 'invoices' })}>Go back</button></div>;
    }

    const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;

    const handleMarkAsPaid = () => {
        updateInvoice({ ...invoice, status: 'Paid' });
    };

    const handleDelete = () => {
        if (window.confirm(t('deleteInvoice') + '?')) {
            deleteInvoice(invoice.id);
            setView({ page: 'invoices' });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="print-hidden flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                    <button onClick={() => setView({ page: 'invoices' })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('invoices')} {invoice.invoiceNumber}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    {invoice.status === 'Pending' && <button onClick={handleMarkAsPaid} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">{t('markAsPaid')}</button>}
                    <button onClick={() => { window.history.pushState({ usr: { invoiceToEdit: invoice } }, ''); setView({ page: 'invoiceForm' }); }} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"><Edit size={20}/></button>
                    <button onClick={handleDelete} className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={20}/></button>
                    <PDFDownloadLink
                        document={<InvoicePDF invoice={invoice} client={client} settings={settings} t={t} />}
                        fileName={`invoice-${invoice.invoiceNumber}.pdf`}
                        className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 flex items-center space-x-2"
                    >
                        {({ loading }) => (
                            loading ? (
                                <span className="flex items-center space-x-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Loading...</span>
                                </span>
                            ) : (
                                <>
                                    <Download size={20} />
                                    <span>Download PDF</span>
                                </>
                            )
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            <div id="invoice-paper" className="bg-white dark:bg-gray-800 p-8 md:p-12 shadow-lg rounded-lg max-w-4xl mx-auto">
                <div className="flex justify-between items-start pb-8 border-b dark:border-gray-600">
                    <div>
                        {settings.logo ? <img src={settings.logo} alt="logo" className="h-16 mb-4 object-contain" /> : <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">{settings.companyName}</h1>}
                        <p className="text-gray-600 dark:text-gray-300">{settings.companyAddress}</p>
                        <p className="text-gray-600 dark:text-gray-300">{settings.companyEmail}</p>
                        {settings.companyVat && <p className="text-gray-600 dark:text-gray-300">{t('vatLabel')}: {settings.companyVat}</p>}
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-bold uppercase text-gray-700 dark:text-gray-200">{t('invoices')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2"># {invoice.invoiceNumber}</p>
                        {invoice.status === 'Paid' && <p className="mt-2 text-2xl font-bold text-green-500 transform -rotate-15">{t('paid').toUpperCase()}</p>}
                    </div>
                </div>

                <div className="flex justify-between py-8">
                    <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('billTo')}</h3>
                        <p className="font-bold text-gray-800 dark:text-white">{client.name}</p>
                        <p className="text-gray-600 dark:text-gray-400">{client.address}</p>
                        <p className="text-gray-600 dark:text-gray-400">{client.email}</p>
                        {client.vatNumber && <p className="text-gray-600 dark:text-gray-400">{t('vatLabel')}: {client.vatNumber}</p>}
                    </div>
                    <div className="text-right">
                        <p><span className="font-semibold text-gray-600 dark:text-gray-300">{t('issueDate')}: </span> {invoice.issueDate}</p>
                        <p><span className="font-semibold text-gray-600 dark:text-gray-300">{t('dueDate')}: </span> {invoice.dueDate}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead >
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">{t('description')}</th>
                                <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase text-center">{t('quantity')}</th>
                                <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase text-right">{t('rate')}</th>
                                <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase text-right">{t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lineItems.map(item => (
                                <tr key={item.id} className="border-b dark:border-gray-700">
                                    <td className="p-3 text-gray-800 dark:text-gray-200">{item.description}</td>
                                    <td className="p-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                    <td className="p-3 text-right text-gray-600 dark:text-gray-300">{settings.currencySymbol}{item.rate.toFixed(2)}</td>
                                    <td className="p-3 text-right text-gray-800 dark:text-gray-200">{settings.currencySymbol}{(item.quantity * item.rate).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-8">
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">{t('subtotal')}:</span>
                            <span className="text-gray-800 dark:text-gray-200">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">{t('tax')} ({invoice.taxRate}%):</span>
                            <span className="text-gray-800 dark:text-gray-200">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="border-t dark:border-gray-600"></div>
                        <div className="flex justify-between font-bold text-xl">
                            <span className="text-gray-800 dark:text-gray-100">{t('total')}:</span>
                            <span className="text-[var(--color-primary)]">{settings.currencySymbol}{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                 <div className="text-center pt-8 mt-8 border-t dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </div>
    );
};

const InvoicesPage: React.FC<InvoicesPageProps> = (props) => {
    const {
        view,
        invoices,
        clients,
        settings,
        setView,
        deleteInvoice,
        duplicateInvoice,
        page,
        totalPages,
        totalCount,
        pageSize,
        nextPage,
        prevPage,
    } = props;
    const { t } = useTranslation();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const filteredInvoices = useMemo(() => {
        return invoices
            .filter(invoice => statusFilter === 'All' || invoice.status === statusFilter)
            .filter(invoice => {
                const client = clients.find(c => c.id === invoice.clientId);
                return invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || client?.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [invoices, clients, searchTerm, statusFilter]);

    const handleMenuToggle = (event: React.MouseEvent<HTMLButtonElement>, invoiceId: string) => {
        event.stopPropagation();
        if (openMenuId === invoiceId) {
            setOpenMenuId(null);
            setMenuPosition(null);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right + window.scrollX,
            });
            setOpenMenuId(invoiceId);
        }
    };
    
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenMenuId(null);
            setMenuPosition(null);
        };

        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [openMenuId]);

    const handleDelete = (id: string) => {
        if (window.confirm(t('deleteInvoice') + '?')) {
            deleteInvoice(id);
        }
    };

    const selectedInvoiceForMenu = useMemo(() => {
        if (!openMenuId) return null;
        return invoices.find(inv => inv.id === openMenuId);
    }, [openMenuId, invoices]);
    
    if (view.page === 'invoiceForm') {
        return <InvoiceForm {...props} />;
    }
    if (view.page === 'invoiceView') {
        window.history.pushState({ usr: { invoiceId: view.id } }, '');
        return <InvoiceView {...props} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('invoices')}</h1>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder={t('searchInvoices')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <button onClick={() => {window.history.pushState({ usr: { invoiceToEdit: undefined, invoiceToDuplicate: undefined } }, ''); setView({ page: 'invoiceForm' });}} className="flex items-center justify-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg shadow hover:opacity-90 transition-opacity whitespace-nowrap">
                        <Plus size={20} className="mr-2" /> {t('newInvoice')}
                    </button>
                </div>
            </div>

            <div className="flex space-x-2">
                {(['All', 'Pending', 'Paid'] as const).map(status => (
                    <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 text-sm rounded-lg ${statusFilter === status ? 'bg-[var(--color-primary)] text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                        {t(status.toLowerCase() as 'all' | 'pending' | 'paid')}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('invoiceNumber')}</th>
                                <th scope="col" className="px-6 py-3">{t('client')}</th>
                                <th scope="col" className="px-6 py-3">{t('dueDate')}</th>
                                <th scope="col" className="px-6 py-3">{t('status')}</th>
                                <th scope="col" className="px-6 py-3">{t('amount')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => {
                                const client = clients.find(c => c.id === invoice.clientId);
                                const total = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0) * (1 + invoice.taxRate / 100);
                                return (
                                    <tr key={invoice.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer" onClick={() => setView({ page: 'invoiceView', id: invoice.id })}>{invoice.invoiceNumber}</td>
                                        <td className="px-6 py-4">{client?.name || 'N/A'}</td>
                                        <td className="px-6 py-4">{invoice.dueDate}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>{t(invoice.status.toLowerCase() as 'paid' | 'pending')}</span></td>
                                        <td className="px-6 py-4">{`${settings.currencySymbol}${total.toFixed(2)}`}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative">
                                                <button onClick={(e) => handleMenuToggle(e, invoice.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                            <span className="font-medium">{totalCount}</span> invoices
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={prevPage}
                                disabled={page === 1}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${
                                    page === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={page === totalPages}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${
                                    page === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedInvoiceForMenu && menuPosition && (
                <div
                    className="absolute"
                    style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, transform: 'translateX(-100%)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 border dark:border-gray-600">
                        <a href="#" onClick={(e) => { e.preventDefault(); setOpenMenuId(null); window.history.pushState({ usr: { invoiceToEdit: selectedInvoiceForMenu } }, ''); setView({ page: 'invoiceForm' }); }} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"><Edit size={14} className="mr-2" /> {t('edit')}</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setOpenMenuId(null); window.history.pushState({ usr: { invoiceToDuplicate: selectedInvoiceForMenu } }, ''); setView({ page: 'invoiceForm' }); }} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"><Copy size={14} className="mr-2" /> {t('duplicate')}</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setOpenMenuId(null); handleDelete(selectedInvoiceForMenu.id); }} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"><Trash2 size={14} className="mr-2" /> {t('delete')}</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicesPage;