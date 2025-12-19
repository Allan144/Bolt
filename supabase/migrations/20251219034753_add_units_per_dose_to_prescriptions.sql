/*
  # Add Units Per Dose to Prescriptions

  Adds tracking for the number of units taken at each scheduled time.

  ## Changes Made
  
  1. New Column Added to `prescriptions` table:
     - `units_per_dose` (integer, default: 1) - Number of units (tablets/pills/capsules/mL) taken at each scheduled time
  
  ## Notes
  - Defaults to 1 for backwards compatibility with existing prescriptions
  - Works with the `unit` field to specify dosage (e.g., "2 tablets" or "5 mL")
*/

-- Add units per dose column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'units_per_dose'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN units_per_dose integer DEFAULT 1;
  END IF;
END $$;