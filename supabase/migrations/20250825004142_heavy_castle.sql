/*
  # Drop existing tables and create enhanced prescription schema

  1. Drop Operations
    - Remove existing medication_logs table
    - Remove existing prescriptions table
    - Clean up any related functions or triggers

  2. New Enhanced Schema
    - `users` table with UserID-based authentication
    - `prescriptions` table with flexible scheduling and custom intervals
    - `medication_logs` table for comprehensive tracking
    - `custom_schedules` table for non-standard timing intervals

  3. Security
    - Enable RLS on all tables
    - Add policies for user-specific data access
    - Create proper foreign key relationships

  4. Performance
    - Add indexes for frequently queried columns
    - Create triggers for automatic timestamp updates
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS medication_logs CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS custom_schedules CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table with UserID authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text,
  full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prescriptions table with enhanced features
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  quantity_per_dose integer DEFAULT 1,
  schedule_type text DEFAULT 'regular' CHECK (schedule_type IN ('regular', 'custom')),
  interval_hours integer DEFAULT 24,
  times_per_day integer DEFAULT 1,
  first_dose_time time DEFAULT '08:00:00',
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create custom schedules table for non-standard intervals
CREATE TABLE IF NOT EXISTS custom_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  dose_time time NOT NULL,
  quantity integer DEFAULT 1,
  days_of_week integer[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  created_at timestamptz DEFAULT now()
);

-- Create medication logs table for tracking
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  taken_time timestamptz,
  quantity_taken integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes text DEFAULT '',
  is_time_corrected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create RLS policies for prescriptions table
CREATE POLICY "Users can manage their own prescriptions"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for custom schedules table
CREATE POLICY "Users can manage their own custom schedules"
  ON custom_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions 
      WHERE prescriptions.id = custom_schedules.prescription_id 
      AND prescriptions.user_id = auth.uid()
    )
  );

-- Create RLS policies for medication logs table
CREATE POLICY "Users can manage their own medication logs"
  ON medication_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_user_id_idx ON users(user_id);
CREATE INDEX IF NOT EXISTS prescriptions_user_id_idx ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS prescriptions_start_date_idx ON prescriptions(start_date);
CREATE INDEX IF NOT EXISTS custom_schedules_prescription_id_idx ON custom_schedules(prescription_id);
CREATE INDEX IF NOT EXISTS medication_logs_user_id_idx ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS medication_logs_prescription_id_idx ON medication_logs(prescription_id);
CREATE INDEX IF NOT EXISTS medication_logs_scheduled_time_idx ON medication_logs(scheduled_time);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();