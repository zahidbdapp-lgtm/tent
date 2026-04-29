/**
 * Expense data conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { Expense, ExpenseCategory } from '@/types';

/**
 * Database Expense type (matches the SQL schema with snake_case columns)
 */
export interface DatabaseExpense {
  id: string;
  owner_id: string;
  property_id: string | null;
  property_name: string | null;
  unit_number: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database expense (snake_case) to TypeScript expense (camelCase)
 */
export function databaseExpenseToTypescript(dbExpense: DatabaseExpense | null): Expense | null {
  if (!dbExpense) return null;

  return {
    id: dbExpense.id,
    ownerId: dbExpense.owner_id,
    propertyId: dbExpense.property_id || '',
    propertyName: dbExpense.property_name || '',
    unitNumber: dbExpense.unit_number || '',
    category: dbExpense.category,
    description: dbExpense.description,
    amount: dbExpense.amount,
    date: dbExpense.date,
    createdAt: dbExpense.created_at,
    updatedAt: dbExpense.updated_at,
  };
}

/**
 * Convert TypeScript expense data (camelCase) to database format (snake_case)
 * Used for insert and update operations
 */
export function typescriptExpenseToDatabase(expense: Partial<Expense>): Partial<DatabaseExpense> {
  const result: Partial<DatabaseExpense> = {};

  const camelToSnakeCaseMap: Record<string, keyof DatabaseExpense> = {
    ownerId: 'owner_id',
    propertyId: 'property_id',
    propertyName: 'property_name',
    unitNumber: 'unit_number',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  // Direct mappings (no conversion needed)
  const directFields = ['id', 'category', 'description', 'amount', 'date'];

  for (const [camelKey, value] of Object.entries(expense)) {
    if (value === undefined) continue;

    if (directFields.includes(camelKey)) {
      result[camelKey as keyof DatabaseExpense] = value;
    } else if (camelToSnakeCaseMap[camelKey]) {
      const snakeKey = camelToSnakeCaseMap[camelKey];
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convert array of database expenses to TypeScript expenses
 */
export function databaseExpensesToTypescript(dbExpenses: DatabaseExpense[]): Expense[] {
  return dbExpenses
    .map(dbExpense => databaseExpenseToTypescript(dbExpense))
    .filter((expense): expense is Expense => expense !== null);
}
