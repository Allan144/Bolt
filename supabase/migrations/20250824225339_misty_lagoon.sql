/*
  # Prescription Reminder Schema

  1. New Tables
    - `prescriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, medication name)
      - `dosage` (text, dosage amount)
      - `interval_hours` (integer, hours between doses)
      - `times_per_day` (integer, doses per day)
      - `start_date` (date)
      - `end_date` (date, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `medication_logs`
      - `id` (uuid, primary key)
      - `prescription_id` (uuid, references prescriptions)
      - `user_id` (uuid, references auth.users)
      - `scheduled_time` (timestamptz)
      - `taken_time` (timestamptz, optional)
      - `status` (text, 'taken', 'missed', 'skipped')
      - `notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dosage text NOT NULL,
  interval_hours integer NOT NULL DEFAULT 24,
  times_per_day integer NOT NULL DEFAULT 1,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medication logs table
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_time timestamptz NOT NULL,
  taken_time timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for prescriptions
CREATE POLICY "Users can manage their own prescriptions"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for medication logs
CREATE POLICY "Users can manage their own medication logs"
  ON medication_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prescriptions_user_id_idx ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS prescriptions_start_date_idx ON prescriptions(start_date);
CREATE INDEX IF NOT EXISTS medication_logs_user_id_idx ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS medication_logs_prescription_id_idx ON medication_logs(prescription_id);
CREATE INDEX IF NOT EXISTS medication_logs_scheduled_time_idx ON medication_logs(scheduled_time);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for prescriptions
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();