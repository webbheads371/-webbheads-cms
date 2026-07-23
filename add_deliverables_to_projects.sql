-- Migration: Add Deliverables to Projects

ALTER TABLE projects
  ADD COLUMN deliverables_content text,
  ADD COLUMN deliverables_approved boolean DEFAULT false,
  ADD COLUMN deliverables_approved_at timestamptz;
