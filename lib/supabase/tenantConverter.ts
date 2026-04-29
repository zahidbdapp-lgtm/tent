/**
 * Tenant data conversion utilities
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { Tenant, TenantFormData } from '@/types';

/**
 * Database Tenant type (matches the SQL schema with snake_case columns)
 */
export interface DatabaseTenant {
  id: string;
  property_id: string;
  owner_id: string;
  unit_number: string;
  name: string;
  email: string;
  phone: string;
  nid: string;
  nid_front_url: string;
  nid_back_url: string;
  photo_url: string;
  monthly_rent: number;
  gas_charge: number;
  water_charge: number;
  service_charge: number;
  electricity_bill: number;
  current_bill: number;
  advance_amount: number;
  advance_months: number;
  move_in_date: string | null;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

/**
 * Convert database tenant (snake_case) to TypeScript tenant (camelCase)
 */
export function databaseTenantToTypescript(dbTenant: DatabaseTenant | null): Tenant | null {
  if (!dbTenant) return null;

  return {
    id: dbTenant.id,
    propertyId: dbTenant.property_id,
    ownerId: dbTenant.owner_id,
    unitNumber: dbTenant.unit_number,
    name: dbTenant.name,
    email: dbTenant.email,
    phone: dbTenant.phone,
    nid: dbTenant.nid,
    nidFrontUrl: dbTenant.nid_front_url,
    nidBackUrl: dbTenant.nid_back_url,
    photoUrl: dbTenant.photo_url,
    monthlyRent: dbTenant.monthly_rent,
    gasCharge: dbTenant.gas_charge,
    waterCharge: dbTenant.water_charge,
    serviceCharge: dbTenant.service_charge,
    electricityBill: dbTenant.electricity_bill,
    currentBill: dbTenant.current_bill,
    advanceAmount: dbTenant.advance_amount,
    advanceMonths: dbTenant.advance_months,
    moveInDate: dbTenant.move_in_date || '',
    status: dbTenant.status,
    createdAt: dbTenant.created_at,
    updatedAt: dbTenant.updated_at,
  };
}

/**
 * Convert TypeScript tenant data (camelCase) to database format (snake_case)
 * Used for insert and update operations
 */
export function typescriptTenantToDatabase(tenant: Partial<Tenant> | TenantFormData): Partial<DatabaseTenant> {
  const result: Partial<DatabaseTenant> = {};

  const camelToSnakeCaseMap: Record<string, keyof DatabaseTenant> = {
    propertyId: 'property_id',
    ownerId: 'owner_id',
    unitNumber: 'unit_number',
    nidFrontUrl: 'nid_front_url',
    nidBackUrl: 'nid_back_url',
    photoUrl: 'photo_url',
    monthlyRent: 'monthly_rent',
    gasCharge: 'gas_charge',
    waterCharge: 'water_charge',
    serviceCharge: 'service_charge',
    electricityBill: 'electricity_bill',
    currentBill: 'current_bill',
    advanceAmount: 'advance_amount',
    advanceMonths: 'advance_months',
    moveInDate: 'move_in_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  // Direct mappings (no conversion needed)
  const directFields = ['id', 'name', 'email', 'phone', 'nid', 'status'];

  for (const [camelKey, value] of Object.entries(tenant)) {
    if (value === undefined) continue;

    if (directFields.includes(camelKey)) {
      result[camelKey as keyof DatabaseTenant] = value;
    } else if (camelToSnakeCaseMap[camelKey]) {
      const snakeKey = camelToSnakeCaseMap[camelKey];
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convert array of database tenants to TypeScript tenants
 */
export function databaseTenantsToTypescript(dbTenants: DatabaseTenant[]): Tenant[] {
  return dbTenants
    .map(dbTenant => databaseTenantToTypescript(dbTenant))
    .filter((tenant): tenant is Tenant => tenant !== null);
}
