/*
  # Drop existing tables for fresh start

  1. Drop Tables
    - Drop all existing tables in correct order to handle foreign key constraints
    - Clean slate for new enhanced schema

  2. Clean Up
    - Remove all existing data
    - Reset for new implementation
*/

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS medication_logs CASCADE;
DROP TABLE IF EXISTS custom_schedules CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;