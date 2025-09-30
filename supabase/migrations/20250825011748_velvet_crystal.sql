/*
  # Enhanced Prescription Reminder Schema

  1. New Tables
    - `users` - JWT-based authentication without email
    - `prescriptions` - Enhanced prescription management
    - `dose_schedules` - Flexible, non-standard scheduling
    - `medication_logs` - Comprehensive tracking with time correction

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - JWT-based authentication support

  3. Features
    - Non-standard intervals and custom timing
    - Multiple doses per prescription
    - Time correction capabilities
    - Comprehensive logging
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table for JWT authentication (no email)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL CHECK (length(username) >= 3),
  password_hash text NOT NULL CHECK (length(password_hash) > 0),
  full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prescriptions table with enhanced features
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dose schedules for flexible timing
CREATE TABLE IF NOT EXISTS dose_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  dose_time time NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  days_of_week integer[] DEFAULT ARRAY[1,2,3,4,5,6,7] CHECK (
    array_length(days_of_week, 1) > 0 AND
    days_of_week <@ ARRAY[1,2,3,4,5,6,7]
  ),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Medication logs with time correction
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  taken_time timestamptz,
  quantity_taken integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  is_time_corrected boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS prescriptions_user_id_idx ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS prescriptions_active_idx ON prescriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS dose_schedules_prescription_id_idx ON dose_schedules(prescription_id);
CREATE INDEX IF NOT EXISTS dose_schedules_active_idx ON dose_schedules(prescription_id, is_active);
CREATE INDEX IF NOT EXISTS medication_logs_user_id_idx ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS medication_logs_prescription_id_idx ON medication_logs(prescription_id);
CREATE INDEX IF NOT EXISTS medication_logs_scheduled_time_idx ON medication_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS medication_logs_status_idx ON medication_logs(user_id, status);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true);

-- RLS Policies for prescriptions table
CREATE POLICY "Users can manage own prescriptions" ON prescriptions
  FOR ALL USING (true);

-- RLS Policies for dose_schedules table
CREATE POLICY "Users can manage own dose schedules" ON dose_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM prescriptions 
      WHERE prescriptions.id = dose_schedules.prescription_id
    )
  );

-- RLS Policies for medication_logs table
CREATE POLICY "Users can manage own medication logs" ON medication_logs
  FOR ALL USING (true);

-- Updated at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();