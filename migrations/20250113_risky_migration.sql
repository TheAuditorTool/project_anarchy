-- Risky SQL Migration: Update user schema and payment data
-- WARNING: This migration has serious issues that could cause data loss

-- ERROR 360: Non-transactional DDL mixed with DML (data loss risk)
-- This migration mixes schema changes with data updates without proper transaction boundaries

-- First, let's drop a column without backing up the data
ALTER TABLE users DROP COLUMN IF EXISTS legacy_status;
-- Just lost all legacy_status data permanently!

-- Add new columns
ALTER TABLE users 
    ADD COLUMN account_balance DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN subscription_tier VARCHAR(50);

-- ERROR 361: Dangerous UPDATE without WHERE clause (affects all rows)
-- This will set EVERY user's balance to 100, not just new users!
UPDATE users SET account_balance = 100.00;
-- Should have WHERE clause: WHERE account_balance IS NULL OR account_balance = 0

-- More risky operations
UPDATE users 
SET subscription_tier = 'premium'
WHERE created_at < '2024-01-01';
-- No NULL check, might overwrite existing values

-- Rename column without checking dependencies
ALTER TABLE payments RENAME COLUMN ammount TO amount;
-- If any views, stored procedures, or application code references 'ammount', they'll break

-- Drop index without checking performance impact
DROP INDEX IF EXISTS idx_users_email;
-- This index might be critical for login performance!

-- Create new table with poor design
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,  -- No foreign key constraint!
    token VARCHAR(255),  -- No unique constraint!
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Missing: expires_at, ip_address, user_agent
);

-- Dangerous data migration
INSERT INTO user_sessions (user_id, token)
SELECT id, MD5(email || RANDOM()::text) 
FROM users;
-- MD5 is cryptographically broken for tokens!

-- Modify critical constraint
ALTER TABLE payments 
    ALTER COLUMN amount DROP NOT NULL;
-- Now payments can have NULL amounts!

-- Delete without archiving
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '30 days';
-- No backup or archive of deleted audit logs!

-- Grant excessive permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO web_user;
-- web_user shouldn't have DELETE, DROP, TRUNCATE permissions!

-- No rollback script provided
-- No validation queries
-- No backup commands
-- No testing on staging
-- Running directly on production

-- Additional issues not counted as errors but problematic:
-- - No IF EXISTS checks for safety
-- - No comments explaining business logic
-- - Mixing multiple concerns in one migration
-- - No performance considerations (missing CONCURRENTLY)
-- - No consideration for running application during migration
-- - Could cause significant downtime