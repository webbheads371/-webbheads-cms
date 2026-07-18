-- Add expected_start_date to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_start_date DATE;
