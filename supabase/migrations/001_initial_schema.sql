-- Hold a Spot - Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SPORTS TABLE
-- ============================================
CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_booking_hours DECIMAL(4,2) NOT NULL DEFAULT 4.0,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credits_reset_date TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('week', NOW() + INTERVAL '1 week'),
  is_admin BOOLEAN NOT NULL DEFAULT false
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- FACILITIES TABLE
-- ============================================
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('court', 'bay')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering by sport and type
CREATE INDEX idx_facilities_sport_type ON facilities(sport_id, type, is_active);

-- ============================================
-- RESERVATIONS TABLE
-- ============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  credits_used DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  cancelled_by TEXT CHECK (cancelled_by IN ('user', 'admin', NULL)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Validation constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT positive_credits CHECK (credits_used > 0)
);

-- Prevent overlapping reservations for same facility
-- This uses btree_gist extension for exclusion constraints with timestamps
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX idx_reservations_facility_time ON reservations(facility_id, start_time, end_time);
CREATE INDEX idx_reservations_user ON reservations(user_id, start_time DESC);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Exclusion constraint: no overlapping confirmed reservations on same facility
ALTER TABLE reservations 
ADD CONSTRAINT no_overlapping_reservations 
EXCLUDE USING gist (
  facility_id WITH =,
  tstzrange(start_time, end_time) WITH &&
)
WHERE (status = 'confirmed');

-- ============================================
-- CREDIT TRANSACTIONS TABLE (Ledger)
-- ============================================
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(5,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('weekly_reset', 'reservation', 'refund', 'admin_adjustment')),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast credit balance calculations
CREATE INDEX idx_credit_transactions_user_time ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);

-- ============================================
-- CALENDAR BLOCKS TABLE (Future use)
-- ============================================
CREATE TABLE calendar_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_block_time CHECK (end_time > start_time)
);

CREATE INDEX idx_calendar_blocks_facility_time ON calendar_blocks(facility_id, start_time, end_time);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on reservations
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (Disabled for MVP)
-- ============================================
-- We'll enable RLS later when adding auth
-- For now, API routes handle all security

-- ============================================
-- VIEWS (Helpful queries)
-- ============================================

-- View: Current user credit balances
CREATE OR REPLACE VIEW user_credit_balances AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(SUM(ct.amount), 0) as current_balance,
  u.credits_reset_date
FROM users u
LEFT JOIN credit_transactions ct ON ct.user_id = u.id 
  AND ct.created_at >= u.credits_reset_date
GROUP BY u.id, u.email, u.credits_reset_date;

-- View: Active facilities with sport info
CREATE OR REPLACE VIEW active_facilities AS
SELECT 
  f.id,
  f.name,
  f.type,
  s.name as sport_name,
  s.id as sport_id,
  s.max_booking_hours,
  s.slot_duration_minutes
FROM facilities f
JOIN sports s ON f.sport_id = s.id
WHERE f.is_active = true AND s.is_active = true;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE sports IS 'Sports available in the facility (pickleball, tennis, etc.)';
COMMENT ON TABLE users IS 'User accounts (email-based, no auth for MVP)';
COMMENT ON TABLE facilities IS 'Physical facilities (courts or bays) linked to sports';
COMMENT ON TABLE reservations IS 'User bookings with time slots and credit usage';
COMMENT ON TABLE credit_transactions IS 'Ledger of all credit movements (never store balance directly)';
COMMENT ON TABLE calendar_blocks IS 'Admin-created blocks for maintenance/events';

COMMENT ON COLUMN users.credits_reset_date IS 'Next Monday when credits reset to 10';
COMMENT ON COLUMN reservations.status IS 'confirmed = active, cancelled = user cancelled, completed = past';
COMMENT ON COLUMN credit_transactions.amount IS 'Can be positive (reset, refund) or negative (booking)';
