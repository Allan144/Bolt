/*
  # Drop existing tables and create new enhanced prescription schema

  1. Drop Operations
    - Drop existing `medication_logs` table (if exists)
    - Drop existing `prescriptions` table (if exists)
    - Drop any related functions or triggers

  2. New Tables
    - `prescriptions` table with enhanced fields for time management
    - `medication_logs` table for tracking medication adherence

  3. Security
    - Enable RLS on both tables
    - Add policies for user-specific data access

  4. Performance
    - Add indexes for common queries
    - Add triggers for automatic timestamp updates
*/

-- Drop existing tables and related objects
DROP TABLE IF EXISTS medication_logs CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create prescriptions table
CREATE TABLE prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  quantity_per_dose integer NOT NULL DEFAULT 1,
  interval_hours integer NOT NULL DEFAULT 24,
  times_per_day integer NOT NULL DEFAULT 1,
  first_dose_time time NOT NULL DEFAULT '08:00:00',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  notes text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medication_logs table
CREATE TABLE medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  taken_time timestamptz,
  quantity_taken integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX prescriptions_user_id_idx ON prescriptions(user_id);
CREATE INDEX prescriptions_start_date_idx ON prescriptions(start_date);
CREATE INDEX medication_logs_user_id_idx ON medication_logs(user_id);
CREATE INDEX medication_logs_prescription_id_idx ON medication_logs(prescription_id);
CREATE INDEX medication_logs_scheduled_time_idx ON medication_logs(scheduled_time);

-- Enable Row Level Security
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prescriptions
CREATE POLICY "Users can manage their own prescriptions"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for medication_logs
CREATE POLICY "Users can manage their own medication logs"
  ON medication_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();