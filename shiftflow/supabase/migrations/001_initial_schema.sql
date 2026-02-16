-- ShiftFlow Database Schema
-- Run this in your Supabase SQL editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT CHECK (industry IN ('restaurant', 'retail', 'salon', 'other')),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Employees table (extends users for employee-specific data)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2),
  skills TEXT[] DEFAULT '{}',
  employment_start_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  max_hours_per_week INTEGER DEFAULT 40,
  preferred_shift_types TEXT[] DEFAULT '{}'
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT NOT NULL CHECK (status IN ('available', 'prefer_not', 'unavailable')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  shift_type TEXT CHECK (shift_type IN ('morning', 'evening', 'night')),
  required_skills TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swap requests table
CREATE TABLE IF NOT EXISTS swap_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  target_shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  target_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  manager_approved BOOLEAN,
  manager_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Time off requests table
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vacation', 'sick_leave', 'personal', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'push')),
  subject TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  metadata JSONB
);

-- Business rules table
CREATE TABLE IF NOT EXISTS business_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  rule_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_employee_date ON availability(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_organization ON schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_shifts_schedule ON shifts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_time_off_employee ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_at);

-- Row Level Security policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can see their own org data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view org members" ON users FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can insert employees" ON users FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

CREATE POLICY "View own organization" ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can update organization" ON organizations FOR UPDATE
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "Managers can insert organization" ON organizations FOR INSERT
  WITH CHECK (true); -- Allow during signup

CREATE POLICY "View employees in org" ON employees FOR SELECT
  USING (id IN (SELECT id FROM users WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Managers can manage employees" ON employees FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "Employees can manage own availability" ON availability FOR ALL
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view all availability" ON availability FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "View org schedules" ON schedules FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage schedules" ON schedules FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "View shifts for own schedules" ON shifts FOR SELECT
  USING (schedule_id IN (SELECT id FROM schedules WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Managers can manage shifts" ON shifts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "View own swap requests" ON swap_requests FOR SELECT
  USING (requester_id = auth.uid() OR target_employee_id = auth.uid());

CREATE POLICY "Managers can view all swaps" ON swap_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "Employees can create swap requests" ON swap_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Managers can update swap requests" ON swap_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "View own time off" ON time_off_requests FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view all time off" ON time_off_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "Employees can create time off requests" ON time_off_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can update time off requests" ON time_off_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

CREATE POLICY "View own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "View org business rules" ON business_rules FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage rules" ON business_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));
