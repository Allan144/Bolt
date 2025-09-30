/*
  # Create medication history table

  1. New Tables
    - `medication_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `prescription_id` (uuid, foreign key to prescriptions)
      - `prescription_name` (text, snapshot of prescription name)
      - `dosage` (text, snapshot of dosage)
      - `scheduled_date` (date, the date it was scheduled for)
      - `scheduled_time` (time, the time it was scheduled for)
      - `actual_taken_datetime` (timestamptz, when it was actually taken)
      - `quantity_taken` (integer, how much was taken)
      - `is_corrected` (boolean, if the time/date was corrected)
      - `notes` (text, optional notes)
      - `created_at` (timestamptz, when the record was created)

  2. Security
    - Enable RLS on `medication_history` table
    - Add policy for users to manage their own history

  3. Indexes
    - Index on user_id for fast user queries
    - Index on prescription_id for prescription-based queries
    - Index on scheduled_date for date-based queries
    - Index on actual_taken_datetime for chronological queries
*/

CREATE TABLE IF NOT EXISTS medication_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  prescription_name text NOT NULL,
  dosage text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  actual_taken_datetime timestamptz NOT NULL,
  quantity_taken integer NOT NULL DEFAULT 1,
  is_corrected boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medication_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own history
CREATE POLICY "Users can manage own medication history"
  ON medication_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX medication_history_user_id_idx ON medication_history(user_id);
CREATE INDEX medication_history_prescription_id_idx ON medication_history(prescription_id);
CREATE INDEX medication_history_scheduled_date_idx ON medication_history(scheduled_date);
CREATE INDEX medication_history_actual_taken_datetime_idx ON medication_history(actual_taken_datetime);
CREATE INDEX medication_history_user_date_idx ON medication_history(user_id, scheduled_date);