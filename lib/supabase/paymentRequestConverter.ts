/**
 * Payment Request data conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { PaymentRequest, PaymentRequestStatus, SubscriptionPlan, PaymentMethod } from '@/types';

/**
 * Database PaymentRequest type (matches the SQL schema with snake_case columns)
 */
export interface DatabasePaymentRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan: SubscriptionPlan;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string;
  payment_number: string;
  payment_date: string;
  screenshot_url: string | null;
  status: PaymentRequestStatus;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
}

/**
 * Convert database payment request (snake_case) to TypeScript payment request (camelCase)
 */
export function databasePaymentRequestToTypescript(dbPayment: DatabasePaymentRequest | null): PaymentRequest | null {
  if (!dbPayment) return null;

  return {
    id: dbPayment.id,
    userId: dbPayment.user_id,
    userEmail: dbPayment.user_email,
    userName: dbPayment.user_name,
    plan: dbPayment.plan,
    amount: dbPayment.amount,
    paymentMethod: dbPayment.payment_method,
    transactionId: dbPayment.transaction_id,
    paymentNumber: dbPayment.payment_number,
    paymentDate: dbPayment.payment_date,
    screenshotUrl: dbPayment.screenshot_url || '',
    status: dbPayment.status,
    createdAt: dbPayment.created_at,
    processedAt: dbPayment.processed_at,
    processedBy: dbPayment.processed_by,
    rejectionReason: dbPayment.rejection_reason,
  };
}

/**
 * Convert TypeScript payment request data (camelCase) to database format (snake_case)
 * Used for insert and update operations
 */
export function typescriptPaymentRequestToDatabase(payment: Partial<PaymentRequest>): Partial<DatabasePaymentRequest> {
  const result: Partial<DatabasePaymentRequest> = {};

  const camelToSnakeCaseMap: Record<string, keyof DatabasePaymentRequest> = {
    userId: 'user_id',
    userEmail: 'user_email',
    userName: 'user_name',
    paymentMethod: 'payment_method',
    transactionId: 'transaction_id',
    paymentNumber: 'payment_number',
    paymentDate: 'payment_date',
    screenshotUrl: 'screenshot_url',
    processedAt: 'processed_at',
    processedBy: 'processed_by',
    rejectionReason: 'rejection_reason',
    createdAt: 'created_at',
  };

  // Direct mappings (no conversion needed) - field names identical in both formats
  const directFields = ['id', 'plan', 'amount', 'status'];

  for (const [camelKey, value] of Object.entries(payment)) {
    if (value === undefined) continue;

    if (directFields.includes(camelKey)) {
      result[camelKey as keyof DatabasePaymentRequest] = value;
    } else if (camelToSnakeCaseMap[camelKey]) {
      const snakeKey = camelToSnakeCaseMap[camelKey];
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convert array of database payment requests to TypeScript payment requests
 */
export function databasePaymentRequestsToTypescript(dbPayments: DatabasePaymentRequest[]): PaymentRequest[] {
  return dbPayments
    .map(dbPayment => databasePaymentRequestToTypescript(dbPayment))
    .filter((payment): payment is PaymentRequest => payment !== null);
}
