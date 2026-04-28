/**
 * Database to TypeScript type conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { User } from '@/types';

/**
 * Database User type (matches the SQL schema with snake_case columns)
 */
export interface DatabaseUser {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  role: 'landlord' | 'admin';
  subscription_status: 'demo' | 'active' | 'payment_pending' | 'payment_due' | 'banned';
  subscription_plan: 'monthly' | 'yearly' | '2year' | null;
  subscription_start_date: string | null;
  subscription_expiry: string | null;
  payment_method: string | null;
  payment_number: string | null;
  payment_transaction_id: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database user (snake_case) to TypeScript user (camelCase)
 */
export function databaseUserToTypescriptUser(dbUser: DatabaseUser | null): User | null {
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.display_name,
    phone: dbUser.phone || '',
    role: dbUser.role,
    subscriptionStatus: dbUser.subscription_status,
    subscriptionPlan: dbUser.subscription_plan,
    subscriptionStartDate: dbUser.subscription_start_date,
    subscriptionExpiry: dbUser.subscription_expiry,
    paymentMethod: (dbUser.payment_method as any) || null,
    paymentNumber: dbUser.payment_number,
    paymentTransactionId: dbUser.payment_transaction_id,
    paymentAmount: dbUser.payment_amount,
    paymentDate: dbUser.payment_date,
    rejectionReason: dbUser.rejection_reason,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

/**
 * Convert TypeScript user (camelCase) to database user (snake_case)
 */
export function typescriptUserToDatabaseUser(user: Partial<User>): Partial<DatabaseUser> {
  const dbUser: Partial<DatabaseUser> = {};

  if (user.id !== undefined) dbUser.id = user.id;
  if (user.email !== undefined) dbUser.email = user.email;
  if (user.displayName !== undefined) dbUser.display_name = user.displayName;
  if (user.phone !== undefined) dbUser.phone = user.phone || null;
  if (user.role !== undefined) dbUser.role = user.role;
  if (user.subscriptionStatus !== undefined) dbUser.subscription_status = user.subscriptionStatus;
  if (user.subscriptionPlan !== undefined) dbUser.subscription_plan = user.subscriptionPlan || null;
  if (user.subscriptionStartDate !== undefined) dbUser.subscription_start_date = user.subscriptionStartDate;
  if (user.subscriptionExpiry !== undefined) dbUser.subscription_expiry = user.subscriptionExpiry;
  if (user.paymentMethod !== undefined) dbUser.payment_method = user.paymentMethod as any;
  if (user.paymentNumber !== undefined) dbUser.payment_number = user.paymentNumber;
  if (user.paymentTransactionId !== undefined) dbUser.payment_transaction_id = user.paymentTransactionId;
  if (user.paymentAmount !== undefined) dbUser.payment_amount = user.paymentAmount;
  if (user.paymentDate !== undefined) dbUser.payment_date = user.paymentDate;
  if (user.rejectionReason !== undefined) dbUser.rejection_reason = user.rejectionReason;
  if (user.createdAt !== undefined) dbUser.created_at = user.createdAt;
  if (user.updatedAt !== undefined) dbUser.updated_at = user.updatedAt;

  return dbUser;
}
