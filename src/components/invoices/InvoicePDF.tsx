import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice, Client, Settings } from '../../types';

interface InvoicePDFProps {
  invoice: Invoice;
  client: Client;
  settings: Settings;
}

// Create professional styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e5',
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '50%',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
  },
  invoiceTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  statusPaid: {
    backgroundColor: '#10b981',
  },
  statusPending: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  billToBox: {
    flexDirection: 'column',
    maxWidth: '48%',
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    fontSize: 9,
    color: '#111827',
  },
  descriptionCell: {
    width: '45%',
  },
  quantityCell: {
    width: '15%',
    textAlign: 'right',
  },
  rateCell: {
    width: '20%',
    textAlign: 'right',
  },
  totalCell: {
    width: '20%',
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  summaryContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 4,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, client, settings }) => {
  // Calculate totals
  const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {settings.logo ? (
              <Image
                src={settings.logo}
                style={styles.logo}
              />
            ) : (
              <Text style={styles.companyName}>{settings.companyName}</Text>
            )}
            <Text style={styles.companyDetails}>{settings.companyAddress}</Text>
            <Text style={styles.companyDetails}>{settings.companyEmail}</Text>
            {settings.companyVAT && (
              <Text style={styles.companyDetails}>VAT: {settings.companyVAT}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                invoice.status === 'Paid' ? styles.statusPaid : styles.statusPending,
              ]}
            >
              <Text style={styles.statusText}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Bill To and Dates */}
        <View style={styles.billToContainer}>
          <View style={styles.billToBox}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientDetails}>{client.address}</Text>
            <Text style={styles.clientDetails}>{client.email}</Text>
            {client.vatNumber && (
              <Text style={styles.clientDetails}>VAT: {client.vatNumber}</Text>
            )}
          </View>
          <View style={styles.billToBox}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.dateLabel}>Issue Date</Text>
              <Text style={styles.dateValue}>{invoice.issueDate}</Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={styles.dateValue}>{invoice.dueDate || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.descriptionCell]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.quantityCell]}>Quantity</Text>
            <Text style={[styles.tableHeaderText, styles.rateCell]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.totalCell]}>Total</Text>
          </View>
          {invoice.lineItems.map((item, index) => {
            const itemTotal = item.quantity * item.rate;
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.descriptionCell]}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCell, styles.quantityCell]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.rateCell]}>
                  {settings.currencySymbol}{item.rate.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, styles.totalCell]}>
                  {settings.currencySymbol}{itemTotal.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {settings.currencySymbol}{subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax ({invoice.taxRate}%)</Text>
            <Text style={styles.summaryValue}>
              {settings.currencySymbol}{taxAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {settings.currencySymbol}{total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by {settings.companyName} • {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};
