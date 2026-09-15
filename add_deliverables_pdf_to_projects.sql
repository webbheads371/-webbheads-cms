-- Migration: Add deliverables_pdf_url to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS deliverables_pdf_url text;
