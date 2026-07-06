-- ============================================================
-- WebbHeads CMS – Add Timeline Stage statuses to projects
-- Run this SQL statement in your Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS timeline_design_status text CHECK (timeline_design_status IN ('completed', 'in_progress', 'upcoming')),
  ADD COLUMN IF NOT EXISTS timeline_dev_status text CHECK (timeline_dev_status IN ('completed', 'in_progress', 'upcoming')),
  ADD COLUMN IF NOT EXISTS timeline_review_status text CHECK (timeline_review_status IN ('completed', 'in_progress', 'upcoming'));
