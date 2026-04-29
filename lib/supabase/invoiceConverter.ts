/**
 * Invoice data conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { Invoice } from '@/types';

/**
 * Database Invoice type (matches the SQL schema with snake_case columns)
 */
export interface DatabaseInvoice {
  id: string;
  tenant_id: string;
  property_id: string;
  owner_id: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone?: string | null;
  unit_number: string;
  month: string;
  rent: number;
  gas_charge: number;
  water_charge: number;
  service_charge: number;
  electricity_bill: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  payment_date: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database invoice (snake_case) to TypeScript invoice (camelCase)
 */
export function databaseInvoiceToTypescript(dbInvoice: DatabaseInvoice | null): Invoice | null {
  if (!dbInvoice) return null;

  return {
    id: dbInvoice.id,
    tenantId: dbInvoice.tenant_id,
    propertyId: dbInvoice.property_id,
    ownerId: dbInvoice.owner_id,
    tenantName: dbInvoice.tenant_name,
    tenantEmail: dbInvoice.tenant_email || '',
    tenantPhone: dbInvoice.tenant_phone || undefined,
    unitNumber: dbInvoice.unit_number,
    month: dbInvoice.month,
    rent: dbInvoice.rent,
    gasCharge: dbInvoice.gas_charge,
    waterCharge: dbInvoice.water_charge,
    serviceCharge: dbInvoice.service_charge,
    electricityBill: dbInvoice.electricity_bill,
    totalAmount: dbInvoice.total_amount,
    paidAmount: dbInvoice.paid_amount,
    dueAmount: dbInvoice.due_amount,
    dueDate: dbInvoice.due_date,
    status: dbInvoice.status,
    paymentDate: dbInvoice.payment_date,
    paymentMethod: dbInvoice.payment_method,
    receiptUrl: dbInvoice.receipt_url,
    emailSent: dbInvoice.email_sent,
    emailSentAt: dbInvoice.email_sent_at,
    createdAt: dbInvoice.created_at,
    updatedAt: dbInvoice.updated_at,
  };
}

/**
 * Convert TypeScript invoice data (camelCase) to database format (snake_case)
 * Used for insert and update operations
 */
export function typescriptInvoiceToDatabase(invoice: Partial<Invoice>): Partial<DatabaseInvoice> {
  const result: Partial<DatabaseInvoice> = {};

  const camelToSnakeCaseMap: Record<string, keyof DatabaseInvoice> = {
    tenantId: 'tenant_id',
    propertyId: 'property_id',
    ownerId: 'owner_id',
    tenantName: 'tenant_name',
    tenantEmail: 'tenant_email',
    tenantPhone: 'tenant_phone',
    unitNumber: 'unit_number',
    gasCharge: 'gas_charge',
    waterCharge: 'water_charge',
    serviceCharge: 'service_charge',
    electricityBill: 'electricity_bill',
    totalAmount: 'total_amount',
    paidAmount: 'paid_amount',
    dueAmount: 'due_amount',
    dueDate: 'due_date',
    paymentDate: 'payment_date',
    paymentMethod: 'payment_method',
    receiptUrl: 'receipt_url',
    emailSent: 'email_sent',
    emailSentAt: 'email_sent_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  // Direct mappings (no conversion needed)
  const directFields = ['id', 'month', 'rent', 'status'];

  for (const [camelKey, value] of Object.entries(invoice)) {
    if (value === undefined) continue;

    if (directFields.includes(camelKey)) {
      result[camelKey as keyof DatabaseInvoice] = value;
    } else if (camelToSnakeCaseMap[camelKey]) {
      const snakeKey = camelToSnakeCaseMap[camelKey];
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convert array of database invoices to TypeScript invoices
 */
export function databaseInvoicesToTypescript(dbInvoices: DatabaseInvoice[]): Invoice[] {
  return dbInvoices
    .map(dbInvoice => databaseInvoiceToTypescript(dbInvoice))
    .filter((invoice): invoice is Invoice => invoice !== null);
}
