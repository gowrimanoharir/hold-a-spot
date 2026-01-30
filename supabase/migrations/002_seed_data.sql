-- Hold a Spot - Seed Data
-- Run this after 001_initial_schema.sql

-- ============================================
-- SEED SPORTS
-- ============================================
INSERT INTO sports (name, max_booking_hours, slot_duration_minutes) VALUES
  ('Pickleball', 4.0, 30);

-- Store the sport ID for facilities
DO $$
DECLARE
  pickleball_id UUID;
BEGIN
  SELECT id INTO pickleball_id FROM sports WHERE name = 'Pickleball';

  -- ============================================
  -- SEED FACILITIES (4 Courts + 6 Bays)
  -- ============================================
  
  -- Pickleball Courts
  INSERT INTO facilities (name, sport_id, type) VALUES
    ('Court 1', pickleball_id, 'court'),
    ('Court 2', pickleball_id, 'court'),
    ('Court 3', pickleball_id, 'court'),
    ('Court 4', pickleball_id, 'court');

  -- Pickleball Bays (Solo Practice)
  INSERT INTO facilities (name, sport_id, type) VALUES
    ('Bay 1', pickleball_id, 'bay'),
    ('Bay 2', pickleball_id, 'bay'),
    ('Bay 3', pickleball_id, 'bay'),
    ('Bay 4', pickleball_id, 'bay'),
    ('Bay 5', pickleball_id, 'bay'),
    ('Bay 6', pickleball_id, 'bay');

END $$;

-- ============================================
-- SEED TEST USERS (Optional - for development)
-- ============================================
-- Set credits_reset_date to LAST MONDAY so transactions count
INSERT INTO users (email, credits_reset_date) VALUES
  ('test@example.com', DATE_TRUNC('week', NOW())),
  ('demo@example.com', DATE_TRUNC('week', NOW()));

-- Give test users initial credits (10 credits)
INSERT INTO credit_transactions (user_id, amount, transaction_type, notes)
SELECT 
  id,
  10.0,
  'weekly_reset',
  'Initial credits for testing'
FROM users;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify data was inserted correctly

-- Check sports
SELECT * FROM sports;

-- Check facilities
SELECT * FROM facilities;

-- Check users and their credits
SELECT * FROM user_credit_balances;

-- Summary
SELECT 
  (SELECT COUNT(*) FROM sports) as total_sports,
  (SELECT COUNT(*) FROM facilities WHERE type = 'court') as total_courts,
  (SELECT COUNT(*) FROM facilities WHERE type = 'bay') as total_bays,
  (SELECT COUNT(*) FROM users) as total_users;
