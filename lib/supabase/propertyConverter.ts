/**
 * Property data conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { Property, PropertyFormData } from '@/types';

/**
 * Database Property type (matches the SQL schema with snake_case columns)
 */
export interface DatabaseProperty {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  total_units: number;
  property_type: 'apartment' | 'house' | 'commercial';
  created_at: string;
  updated_at: string;
}

/**
 * Convert database property (snake_case) to TypeScript property (camelCase)
 */
export function databasePropertyToTypescript(dbProperty: DatabaseProperty | null): Property | null {
  if (!dbProperty) return null;

  return {
    id: dbProperty.id,
    ownerId: dbProperty.owner_id,
    name: dbProperty.name,
    address: dbProperty.address,
    totalUnits: dbProperty.total_units,
    propertyType: dbProperty.property_type,
    createdAt: dbProperty.created_at,
    updatedAt: dbProperty.updated_at,
  };
}

/**
 * Convert TypeScript property data (camelCase) to database format (snake_case)
 * Used for insert and update operations
 */
export function typescriptPropertyToDatabase(property: Partial<Property> | PropertyFormData): Partial<DatabaseProperty> {
  const result: Partial<DatabaseProperty> = {};

  const camelToSnakeCaseMap: Record<string, keyof DatabaseProperty> = {
    ownerId: 'owner_id',
    totalUnits: 'total_units',
    propertyType: 'property_type',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  // Direct mappings (no conversion needed)
  const directFields = ['id', 'name', 'address'];

  for (const [camelKey, value] of Object.entries(property)) {
    if (value === undefined) continue;

    if (directFields.includes(camelKey)) {
      result[camelKey as keyof DatabaseProperty] = value;
    } else if (camelToSnakeCaseMap[camelKey]) {
      const snakeKey = camelToSnakeCaseMap[camelKey];
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convert array of database properties to TypeScript properties
 */
export function databasePropertiesToTypescript(dbProperties: DatabaseProperty[]): Property[] {
  return dbProperties
    .map(dbProperty => databasePropertyToTypescript(dbProperty))
    .filter((property): property is Property => property !== null);
}
