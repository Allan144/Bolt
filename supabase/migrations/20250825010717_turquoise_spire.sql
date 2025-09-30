/*
  # Add auth_id column to users table

  1. Changes
    - Add `auth_id` column to link with Supabase auth users
    - Update existing constraints and indexes
    - Add foreign key relationship to auth.users

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Add auth_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id uuid;

-- Add foreign key constraint to auth.users
ALTER TABLE users ADD CONSTRAINT users_auth_id_fkey 
  FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON users(auth_id);

-- Add unique constraint to ensure one profile per auth user
ALTER TABLE users ADD CONSTRAINT users_auth_id_unique UNIQUE (auth_id);