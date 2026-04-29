/**
 * Notice data conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { Notice, NoticePriority } from '@/types';

/**
 * Database Notice type (matches the SQL schema with snake_case columns)
 */
export interface DatabaseNotice {
  id: string;
  property_id: string;
  owner_id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  expires_at: string | null;
  created_at: string;
}

/**
 * Convert database notice (snake_case) to TypeScript notice (camelCase)
 */
export function databaseNoticeToTypescript(dbNotice: DatabaseNotice | null): Notice | null {
  if (!dbNotice) return null;

  return {
    id: dbNotice.id,
    propertyId: dbNotice.property_id,
    ownerId: dbNotice.owner_id,
    title: dbNotice.title,
    content: dbNotice.content,
    priority: dbNotice.priority,
    createdAt: dbNotice.created_at,
    expiresAt: dbNotice.expires_at || '',
  };
}

/**
 * Convert TypeScript notice data (camelCase) to database format (snake_case)
 * Used for insert and update operations
 */
export function typescriptNoticeToDatabase(notice: Partial<Notice>): Partial<DatabaseNotice> {
  const result: Partial<DatabaseNotice> = {};

  const camelToSnakeCaseMap: Record<string, keyof DatabaseNotice> = {
    propertyId: 'property_id',
    ownerId: 'owner_id',
    expiresAt: 'expires_at',
    createdAt: 'created_at',
  };

  // Direct mappings (no conversion needed)
  const directFields = ['id', 'title', 'content', 'priority'];

  for (const [camelKey, value] of Object.entries(notice)) {
    if (value === undefined) continue;

    if (directFields.includes(camelKey)) {
      result[camelKey as keyof DatabaseNotice] = value;
    } else if (camelToSnakeCaseMap[camelKey]) {
      const snakeKey = camelToSnakeCaseMap[camelKey];
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convert array of database notices to TypeScript notices
 */
export function databaseNoticesToTypescript(dbNotices: DatabaseNotice[]): Notice[] {
  return dbNotices
    .map(dbNotice => databaseNoticeToTypescript(dbNotice))
    .filter((notice): notice is Notice => notice !== null);
}
