/*
  # Add NDC Code and Unit to Prescriptions

  Enhances the prescriptions table with medication identification and unit tracking.

  ## Changes Made
  
  1. New Columns Added to `prescriptions` table:
     - `ndc_code` (text, nullable) - National Drug Code for medication identification
     - `unit` (text, default: 'tablet') - Type of medication unit (tablet, pill, capsule, mL, etc.)
  
  ## Notes
  - NDC code is nullable to allow for medications without standard codes
  - Unit defaults to 'tablet' for backwards compatibility
  - Existing prescriptions will have null NDC codes and 'tablet' as unit
*/

-- Add NDC code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'ndc_code'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN ndc_code text;
  END IF;
END $$;

-- Add unit column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'unit'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN unit text DEFAULT 'tablet';
  END IF;
END $$;