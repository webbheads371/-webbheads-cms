-- ============================================================
-- WebbHeads CMS – Content Schedule Feature
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Content schedule items for client projects
CREATE TABLE IF NOT EXISTS public.content_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  content_name text NOT NULL,
  caption text,
  scheduled_at timestamptz NOT NULL,
  is_posted boolean DEFAULT false,
  posted_at timestamptz,
  created_by uuid REFERENCES public.staff(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.staff(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;

-- Staff (admin/sales) can do everything; leads can read their assigned projects
CREATE POLICY content_schedule_staff_all ON public.content_schedule
  FOR ALL
  USING (current_staff_role() IN ('admin', 'sales') OR is_project_assignee(project_id));

-- Client can read their own project's content schedule
CREATE POLICY content_schedule_client_select ON public.content_schedule
  FOR SELECT
  USING (
    is_client_role()
    AND project_id IN (SELECT id FROM public.projects WHERE client_id = current_client_id())
  );

-- ============================================================
-- Seed: insert 3 sample content items for testing
-- Replace '2f1ebb4b-0942-43aa-a895-edb734faa7f8' with your actual project ID
-- ============================================================

INSERT INTO public.content_schedule (project_id, content_name, caption, scheduled_at, is_posted)
VALUES
  ('2f1ebb4b-0942-43aa-a895-edb734faa7f8', 'Brand Introduction Reel', 'Introducing WebbHeads — your growth partner 🚀 #branding #digital', now() - interval '5 days', true),
  ('2f1ebb4b-0942-43aa-a895-edb734faa7f8', 'Services Carousel Post', 'Here is what we offer — design, development & strategy. Swipe to see! 👉 #services', now() + interval '2 days', false),
  ('2f1ebb4b-0942-43aa-a895-edb734faa7f8', 'Testimonial Story', 'Our clients say it best! ⭐ Drop a comment if you want to work with us! #testimonial', now() + interval '7 days', false);
