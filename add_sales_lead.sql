-- ============================================================
-- WebbHeads CMS – Add Sales Lead assignment to projects
-- Run this SQL statement in your Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS sales_lead_id uuid REFERENCES public.staff(id) ON DELETE SET NULL;
