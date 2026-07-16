-- ============================================================
-- WebbHeads CMS – Add editable timeline phase names to projects
-- Run this SQL in your Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS timeline_design_name text DEFAULT 'Design Phase',
  ADD COLUMN IF NOT EXISTS timeline_dev_name text DEFAULT 'Development',
  ADD COLUMN IF NOT EXISTS timeline_review_name text DEFAULT 'Review';

-- Backfill existing rows with defaults
UPDATE public.projects
SET
  timeline_design_name = COALESCE(timeline_design_name, 'Design Phase'),
  timeline_dev_name    = COALESCE(timeline_dev_name, 'Development'),
  timeline_review_name = COALESCE(timeline_review_name, 'Review')
WHERE timeline_design_name IS NULL
   OR timeline_dev_name    IS NULL
   OR timeline_review_name IS NULL;
