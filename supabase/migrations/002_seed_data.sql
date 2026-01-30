-- Hold a Spot - Seed Data
-- Sample data for development and testing

-- ============================================
-- SPORTS
-- ============================================
INSERT INTO sports (name, max_booking_hours, slot_duration_minutes) VALUES
  ('Pickleball', 4.0, 30);

-- ============================================
-- USERS
-- ============================================
INSERT INTO users (email, bonus_credits) VALUES
  ('test@example.com', 0),
  ('demo@example.com', 0);

-- ============================================
-- FACILITIES
-- ============================================
-- Get the Pickleball sport ID
DO $$
DECLARE
  pickleball_id UUID;
BEGIN
  SELECT id INTO pickleball_id FROM sports WHERE name = 'Pickleball';
  
  -- Insert Pickleball courts
  INSERT INTO facilities (name, sport_id, type) VALUES
    ('Court 1', pickleball_id, 'court'),
    ('Court 2', pickleball_id, 'court'),
    ('Court 3', pickleball_id, 'court'),
    ('Court 4', pickleball_id, 'court');
  
  -- Insert Practice bays
  INSERT INTO facilities (name, sport_id, type) VALUES
    ('Bay 1', pickleball_id, 'bay'),
    ('Bay 2', pickleball_id, 'bay'),
    ('Bay 3', pickleball_id, 'bay'),
    ('Bay 4', pickleball_id, 'bay'),
    ('Bay 5', pickleball_id, 'bay'),
    ('Bay 6', pickleball_id, 'bay');
END $$;

-- ============================================
-- SAMPLE RESERVATIONS (Optional - for testing)
-- ============================================
-- Uncomment below to add sample bookings

-- DO $$
-- DECLARE
--   test_user_id UUID;
--   court1_id UUID;
-- BEGIN
--   SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com';
--   SELECT id INTO court1_id FROM facilities WHERE name = 'Court 1';
--   
--   -- Sample booking for tomorrow at 10 AM (2 hours)
--   INSERT INTO reservations (user_id, facility_id, start_time, end_time, credits_used, status)
--   VALUES (
--     test_user_id,
--     court1_id,
--     (NOW() + INTERVAL '1 day')::DATE + TIME '10:00:00',
--     (NOW() + INTERVAL '1 day')::DATE + TIME '12:00:00',
--     4,
--     'confirmed'
--   );
-- END $$;
