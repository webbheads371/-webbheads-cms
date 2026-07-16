-- ============================================================
-- WebbHeads CMS – Add Messaging System
-- Run this SQL statement in your Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'admin', 'tech_lead', 'content_lead', 'sales')),
  recipient_role text NOT NULL CHECK (recipient_role IN ('client', 'admin', 'tech_lead', 'content_lead', 'sales')),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ---------- Enable RLS ----------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ---------- Indexes for Performance ----------
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ---------- RLS Policies ----------

-- 1. Clients can read all messages for their projects
DROP POLICY IF EXISTS messages_client_select ON public.messages;
CREATE POLICY messages_client_select ON public.messages FOR SELECT
  USING (
    is_client_role() AND project_id IN (
      SELECT id FROM public.projects WHERE client_id = current_client_id()
    )
  );

-- 2. Clients can insert messages for their projects as 'client'
DROP POLICY IF EXISTS messages_client_insert ON public.messages;
CREATE POLICY messages_client_insert ON public.messages FOR INSERT
  WITH CHECK (
    is_client_role() AND project_id IN (
      SELECT id FROM public.projects WHERE client_id = current_client_id()
    ) AND sender_role = 'client'
  );

-- 3. Staff can read messages for projects they are assigned to (or all if admin/sales)
DROP POLICY IF EXISTS messages_staff_select ON public.messages;
CREATE POLICY messages_staff_select ON public.messages FOR SELECT
  USING (
    current_staff_role() IN ('admin', 'sales') OR 
    is_project_assignee(project_id)
  );

-- 4. Staff can insert messages if they are assigned to the project (or all if admin/sales)
DROP POLICY IF EXISTS messages_staff_insert ON public.messages;
CREATE POLICY messages_staff_insert ON public.messages FOR INSERT
  WITH CHECK (
    current_staff_role() IS NOT NULL AND (
      current_staff_role() IN ('admin', 'sales') OR
      is_project_assignee(project_id)
    )
  );
