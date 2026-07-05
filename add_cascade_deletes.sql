-- ============================================================
-- WebbHeads CMS – Fix client deletion issues
-- Paste this into the Supabase SQL Editor and run it.
-- ============================================================

-- ── STEP 1: Add missing DELETE policy on clients table ─────────────────────
-- Without this, even service-role deletes can be blocked in some Supabase
-- configurations. This allows admins to hard-delete clients.

DROP POLICY IF EXISTS clients_admin_delete ON public.clients;
CREATE POLICY clients_admin_delete ON public.clients
  FOR DELETE
  USING (current_staff_role() IN ('admin', 'tech_lead'));

-- ── STEP 2: Ensure ON DELETE CASCADE on all FK chains ─────────────────────
-- Run these even if you ran add_cascade_deletes.sql before – they are safe
-- to re-run because we DROP CONSTRAINT IF EXISTS first.

-- client_users → clients
ALTER TABLE public.client_users
  DROP CONSTRAINT IF EXISTS client_users_client_id_fkey,
  ADD CONSTRAINT client_users_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- projects → clients
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_client_id_fkey,
  ADD CONSTRAINT projects_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- documents → projects
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_project_id_fkey,
  ADD CONSTRAINT documents_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- agreements → projects
ALTER TABLE public.agreements
  DROP CONSTRAINT IF EXISTS agreements_project_id_fkey,
  ADD CONSTRAINT agreements_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- payment_requests → projects
ALTER TABLE public.payment_requests
  DROP CONSTRAINT IF EXISTS payment_requests_project_id_fkey,
  ADD CONSTRAINT payment_requests_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- payments → projects
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_project_id_fkey,
  ADD CONSTRAINT payments_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- form_responses → projects
ALTER TABLE public.form_responses
  DROP CONSTRAINT IF EXISTS form_responses_project_id_fkey,
  ADD CONSTRAINT form_responses_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- activity_log → projects
ALTER TABLE public.activity_log
  DROP CONSTRAINT IF EXISTS activity_log_project_id_fkey,
  ADD CONSTRAINT activity_log_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- project_status_updates → projects
ALTER TABLE public.project_status_updates
  DROP CONSTRAINT IF EXISTS project_status_updates_project_id_fkey,
  ADD CONSTRAINT project_status_updates_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- project_checklist_items → projects
ALTER TABLE public.project_checklist_items
  DROP CONSTRAINT IF EXISTS project_checklist_items_project_id_fkey,
  ADD CONSTRAINT project_checklist_items_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- ── STEP 3: Verify (optional – run this to confirm) ────────────────────────
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table,
--   rc.delete_rule
-- FROM information_schema.table_constraints AS tc
--   JOIN information_schema.key_column_usage AS kcu
--     ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
--   JOIN information_schema.constraint_column_usage AS ccu
--     ON ccu.constraint_name = tc.constraint_name
--   JOIN information_schema.referential_constraints AS rc
--     ON rc.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
--   AND ccu.table_name IN ('clients', 'projects')
-- ORDER BY tc.table_name;

-- ── END ─────────────────────────────────────────────────────────────────────
