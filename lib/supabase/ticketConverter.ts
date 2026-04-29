/**
 * Ticket data conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { Ticket } from '@/types';

/**
 * Database Ticket type (matches the SQL schema with snake_case columns)
 */
export interface DatabaseTicket {
  id: string;
  tenant_id: string;
  property_id: string;
  owner_id: string;
  tenant_name: string;
  subject: string;
  description: string;
  category: 'maintenance' | 'complaint' | 'inquiry' | 'other';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

/**
 * Convert database ticket (snake_case) to TypeScript ticket (camelCase)
 */
export function databaseTicketToTypescript(dbTicket: DatabaseTicket | null): Ticket | null {
  if (!dbTicket) return null;

  return {
    id: dbTicket.id,
    tenantId: dbTicket.tenant_id,
    propertyId: dbTicket.property_id,
    ownerId: dbTicket.owner_id,
    tenantName: dbTicket.tenant_name,
    subject: dbTicket.subject,
    description: dbTicket.description,
    category: dbTicket.category,
    status: dbTicket.status,
    createdAt: dbTicket.created_at,
    updatedAt: dbTicket.updated_at,
  };
}

/**
 * Convert TypeScript ticket data (camelCase) to database format (snake_case)
 * Used for insert and update operations
 */
export function typescriptTicketToDatabase(ticket: Partial<Ticket>): Partial<DatabaseTicket> {
  const result: Partial<DatabaseTicket> = {};

  const camelToSnakeCaseMap: Record<string, keyof DatabaseTicket> = {
    tenantId: 'tenant_id',
    propertyId: 'property_id',
    ownerId: 'owner_id',
    tenantName: 'tenant_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  // Direct mappings (no conversion needed)
  const directFields = ['id', 'subject', 'description', 'category', 'status'];

  for (const [camelKey, value] of Object.entries(ticket)) {
    if (value === undefined) continue;

    if (directFields.includes(camelKey)) {
      result[camelKey as keyof DatabaseTicket] = value;
    } else if (camelToSnakeCaseMap[camelKey]) {
      const snakeKey = camelToSnakeCaseMap[camelKey];
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convert array of database tickets to TypeScript tickets
 */
export function databaseTicketsToTypescript(dbTickets: DatabaseTicket[]): Ticket[] {
  return dbTickets
    .map(dbTicket => databaseTicketToTypescript(dbTicket))
    .filter((ticket): ticket is Ticket => ticket !== null);
}
