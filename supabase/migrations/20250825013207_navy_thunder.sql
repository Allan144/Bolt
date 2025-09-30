/*
  # Remove password_hash column from users table

  1. Changes
    - Remove `password_hash` column from `users` table
    - Supabase Auth handles password hashing internally
    - Clean separation of concerns between custom user profiles and authentication

  2. Security
    - Maintains existing RLS policies
    - No impact on user authentication flow
*/

-- Remove the password_hash column as Supabase handles this internally
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;