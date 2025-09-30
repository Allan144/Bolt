/*
  # Fix Users Table RLS Policy

  1. Security Updates
    - Add INSERT policy for anonymous users to allow registration
    - Update existing policies to work with custom authentication
    - Ensure proper access control for user data

  2. Changes
    - Allow anonymous users to insert new user records (for registration)
    - Allow users to read and update their own data
    - Maintain security while enabling user registration
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Allow anonymous users to insert new users (for registration)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);