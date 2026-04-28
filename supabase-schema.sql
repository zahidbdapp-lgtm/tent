-- Supabase Database Schema for PropManager
-- Safe to run multiple times - drops existing objects before creating

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- DROP EXISTING OBJECTS (for re-runs)
-- ==========================================
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Owners can view own properties" ON properties;
DROP POLICY IF EXISTS "Owners can insert properties" ON properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON properties;
DROP POLICY IF EXISTS "Owners can delete own properties" ON properties;
DROP POLICY IF EXISTS "Owners can view own tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can update own tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can delete own tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Owners can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Owners can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Owners can delete own invoices" ON invoices;
DROP POLICY IF EXISTS "Owners can view own notices" ON notices;
DROP POLICY IF EXISTS "Owners can insert notices" ON notices;
DROP POLICY IF EXISTS "Owners can update own notices" ON notices;
DROP POLICY IF EXISTS "Owners can delete own notices" ON notices;
DROP POLICY IF EXISTS "Owners can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Owners can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Owners can update own tickets" ON tickets;
DROP POLICY IF EXISTS "Owners can delete own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view own payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Users can insert payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Owners can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Owners can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Owners can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Owners can delete own expenses" ON expenses;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;

DROP FUNCTION IF EXISTS update_updated_at_column();

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'landlord' CHECK (role IN ('landlord', 'admin')),
  subscription_status VARCHAR(50) DEFAULT 'demo' CHECK (subscription_status IN ('demo', 'active', 'payment_pending', 'payment_due', 'banned')),
  subscription_plan VARCHAR(50) CHECK (subscription_plan IN ('monthly', 'yearly', '2year')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  payment_number VARCHAR(50),
  payment_transaction_id VARCHAR(255),
  payment_amount DECIMAL(10, 2),
  payment_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. PROPERTIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 1,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('apartment', 'house', 'commercial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. TENANTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  nid VARCHAR(100) NOT NULL,
  nid_front_url TEXT,
  nid_back_url TEXT,
  photo_url TEXT,
  monthly_rent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  gas_charge DECIMAL(10, 2) DEFAULT 0,
  water_charge DECIMAL(10, 2) DEFAULT 0,
  service_charge DECIMAL(10, 2) DEFAULT 0,
  electricity_bill DECIMAL(10, 2) DEFAULT 0,
  current_bill DECIMAL(10, 2) DEFAULT 0,
  advance_amount DECIMAL(10, 2) DEFAULT 0,
  advance_months INTEGER DEFAULT 0,
  move_in_date DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. INVOICES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_name VARCHAR(255) NOT NULL,
  tenant_email VARCHAR(255),
  unit_number VARCHAR(50) NOT NULL,
  month VARCHAR(100) NOT NULL,
  rent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  gas_charge DECIMAL(10, 2) DEFAULT 0,
  water_charge DECIMAL(10, 2) DEFAULT 0,
  service_charge DECIMAL(10, 2) DEFAULT 0,
  electricity_bill DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  due_amount DECIMAL(10, 2) DEFAULT 0,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  receipt_url TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. NOTICES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. TICKETS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('maintenance', 'complaint', 'inquiry', 'other')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. PAYMENT_REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('monthly', 'yearly', '2year')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'rocket')),
  transaction_id VARCHAR(255) NOT NULL,
  payment_number VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL,
  screenshot_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id),
  rejection_reason TEXT
);

-- ==========================================
-- 8. EXPENSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_name VARCHAR(255),
  unit_number VARCHAR(50),
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('service', 'maintenance', 'utility', 'tax', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_id ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_notices_owner_id ON notices(owner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_owner_id ON tickets(owner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON expenses(property_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: "Admins can view all users" policy removed to prevent infinite recursion
-- Use auth.jwt() claims or a separate admin_roles table for role-based access in production

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can view own properties" ON properties
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert properties" ON properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own properties" ON properties
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own properties" ON properties
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Owners can view own tenants" ON tenants
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert tenants" ON tenants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own tenants" ON tenants
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own tenants" ON tenants
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Owners can view own invoices" ON invoices
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert invoices" ON invoices
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own invoices" ON invoices
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own invoices" ON invoices
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Owners can view own notices" ON notices
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert notices" ON notices
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own notices" ON notices
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own notices" ON notices
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Owners can view own tickets" ON tickets
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert tickets" ON tickets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own tickets" ON tickets
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own tickets" ON tickets
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payment requests" ON payment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can insert payment requests" ON payment_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view own expenses" ON expenses
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert expenses" ON expenses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own expenses" ON expenses
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own expenses" ON expenses
  FOR DELETE USING (owner_id = auth.uid());

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
