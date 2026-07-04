-- SQL script to add ON DELETE CASCADE to foreign keys for WebbHeads CMS
-- Paste this into the Supabase SQL Editor and run it.

-- 1. client_users references clients
ALTER TABLE public.client_users 
  DROP CONSTRAINT IF EXISTS client_users_client_id_fkey,
  ADD CONSTRAINT client_users_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 2. projects references clients
ALTER TABLE public.projects 
  DROP CONSTRAINT IF EXISTS projects_client_id_fkey,
  ADD CONSTRAINT projects_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 3. documents references projects
ALTER TABLE public.documents 
  DROP CONSTRAINT IF EXISTS documents_project_id_fkey,
  ADD CONSTRAINT documents_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 4. agreements references projects
ALTER TABLE public.agreements 
  DROP CONSTRAINT IF EXISTS agreements_project_id_fkey,
  ADD CONSTRAINT agreements_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 5. payment_requests references projects
ALTER TABLE public.payment_requests 
  DROP CONSTRAINT IF EXISTS payment_requests_project_id_fkey,
  ADD CONSTRAINT payment_requests_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 6. payments references projects
ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS payments_project_id_fkey,
  ADD CONSTRAINT payments_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 7. form_responses references projects
ALTER TABLE public.form_responses 
  DROP CONSTRAINT IF EXISTS form_responses_project_id_fkey,
  ADD CONSTRAINT form_responses_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 8. activity_log references projects
ALTER TABLE public.activity_log 
  DROP CONSTRAINT IF EXISTS activity_log_project_id_fkey,
  ADD CONSTRAINT activity_log_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 9. project_status_updates references projects
ALTER TABLE public.project_status_updates 
  DROP CONSTRAINT IF EXISTS project_status_updates_project_id_fkey,
  ADD CONSTRAINT project_status_updates_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 10. project_checklist_items references projects
ALTER TABLE public.project_checklist_items 
  DROP CONSTRAINT IF EXISTS project_checklist_items_project_id_fkey,
  ADD CONSTRAINT project_checklist_items_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
