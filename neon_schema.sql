-- ============================================================
-- WebbHeads Client Management System (WCMS) - NEON MIGRATION
-- Run this completely in your Neon SQL Editor to create the fresh DB.
-- ============================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- 1. Users & Authentication ----------

-- Staff Table (Replaces auth.users connection)
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL, -- Added for NextAuth
  reset_token text,            -- Added for Password Reset
  reset_token_expires timestamptz,
  role text NOT NULL CHECK (role IN ('admin','tech_lead','content_lead','sales')),
  created_at timestamptz DEFAULT now()
);

-- Clients Base Table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  source text,
  client_type text NOT NULL DEFAULT 'both' CHECK (client_type IN ('tech','content','both')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES staff(id)
);

-- Client Login Users (Replaces auth.users connection)
CREATE TABLE client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL, -- Added for NextAuth
  reset_token text,            -- Added for Password Reset
  reset_token_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES staff(id)
);


-- ---------- 2. Core Entities ----------

CREATE TABLE pipeline_stages (
  key text PRIMARY KEY,
  label text NOT NULL,
  sort_order int NOT NULL
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_stage text REFERENCES pipeline_stages(key) NOT NULL DEFAULT 'quotation',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed_won','closed_lost')),
  tech_lead_id uuid REFERENCES staff(id),
  content_lead_id uuid REFERENCES staff(id),
  sales_lead_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  project_value numeric,
  advance_percent numeric DEFAULT 50,
  expected_close_date date,
  expected_start_date date,
  
  -- Timeline statuses & names
  timeline_design_status text CHECK (timeline_design_status IN ('completed', 'in_progress', 'upcoming')),
  timeline_dev_status text CHECK (timeline_dev_status IN ('completed', 'in_progress', 'upcoming')),
  timeline_review_status text CHECK (timeline_review_status IN ('completed', 'in_progress', 'upcoming')),
  timeline_design_name text DEFAULT 'Design Phase',
  timeline_dev_name text DEFAULT 'Development',
  timeline_review_name text DEFAULT 'Review',
  
  -- Portal metrics
  welcome_seen_at timestamptz,
  profile_submitted_at timestamptz,
  handles_collected boolean DEFAULT false,
  handles_collected_at timestamptz,
  deliverables_content text,
  deliverables_approved boolean DEFAULT false,
  deliverables_approved_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- ---------- 3. Project Features ----------

CREATE TABLE checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key text REFERENCES pipeline_stages(key) NOT NULL,
  label text NOT NULL,
  category text NOT NULL CHECK (category IN ('tech','content','sales','general')),
  is_required boolean DEFAULT true,
  sort_order int NOT NULL
);

CREATE TABLE project_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  template_id uuid REFERENCES checklist_templates(id),
  stage_key text REFERENCES pipeline_stages(key) NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  is_required boolean NOT NULL,
  is_done boolean DEFAULT false,
  done_by uuid REFERENCES staff(id),
  done_at timestamptz,
  notes text
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_type text CHECK (payment_type IN ('advance','partial','final')),
  method text,
  paid_on date NOT NULL,
  note text,
  recorded_by uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  title text NOT NULL,
  url text,
  uploaded_by uuid REFERENCES staff(id),
  uploaded_at timestamptz DEFAULT now(),
  is_client_visible boolean DEFAULT false
);

CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES staff(id),
  action text NOT NULL,
  detail jsonb,
  created_at timestamptz DEFAULT now()
);

-- Messaging System
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL, -- Application handles whether this is staff or client ID
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'admin', 'tech_lead', 'content_lead', 'sales')),
  recipient_role text NOT NULL CHECK (recipient_role IN ('client', 'admin', 'tech_lead', 'content_lead', 'sales')),
  recipient_id uuid, -- Application handles whether this is staff or client ID
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);

-- Content Schedule
CREATE TABLE content_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content_name text NOT NULL,
  caption text,
  scheduled_at timestamptz NOT NULL,
  is_posted boolean DEFAULT false,
  posted_at timestamptz,
  created_by uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES staff(id),
  updated_at timestamptz DEFAULT now()
);

-- ---------- 4. Client Portal Specifics ----------

CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pdf_url text NOT NULL,
  uploaded_by uuid REFERENCES staff(id),
  uploaded_at timestamptz DEFAULT now(),
  client_agreed boolean DEFAULT false,
  agreed_at timestamptz,
  signature_url text,
  signature_uploaded_at timestamptz,
  confirmation_email_sent boolean DEFAULT false,
  confirmation_email_sent_at timestamptz
);

CREATE TABLE bank_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  upi_id text,
  qr_image_url text,
  bank_name text,
  account_holder text,
  account_number text,
  ifsc text,
  updated_by uuid REFERENCES staff(id),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO bank_settings (id) VALUES (1);

CREATE TABLE payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('advance','final')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','submitted','approved','rejected')),
  screenshot_url text,
  submitted_at timestamptz,
  verified_by uuid REFERENCES staff(id),
  verified_at timestamptz,
  rejection_reason text,
  released boolean DEFAULT false,
  released_by uuid REFERENCES staff(id),
  released_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, request_type)
);

CREATE TABLE form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('tech','content','general')),
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text','textarea','file','url','checkbox')),
  is_required boolean DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES form_templates(id) NOT NULL,
  value text,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE (project_id, template_id)
);

CREATE TABLE project_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  posted_by uuid REFERENCES staff(id),
  posted_at timestamptz DEFAULT now(),
  visible_to_client boolean DEFAULT true
);

-- ---------- 5. Seed Initial Data ----------

INSERT INTO pipeline_stages (key, label, sort_order) VALUES
  ('quotation',        'Quotation / Proposal / Analytics / Demo', 0),
  ('welcome',          'Welcome Letter / Mail',                   1),
  ('agreement',        'Agreement + Payment',                     2),
  ('profile_handover', 'Profile Handover',                        3),
  ('timeline',         'Timeline Document',                       4),
  ('script_tech_flow', 'Script + Tech Flow Document',             5),
  ('goal_measurement', 'Goal Measurement',                        6),
  ('onboarding',       'Onboarding / Close-out',                  7),
  ('closed_won',       'Closed - Won',                            8),
  ('closed_lost',      'Closed - Lost',                           9);

INSERT INTO checklist_templates (stage_key, label, category, is_required, sort_order) VALUES
  ('quotation', 'Quotation sent', 'sales', true, 0),
  ('quotation', 'Client decision Y/N', 'sales', true, 1),
  ('closed_lost', 'Thank-you message sent', 'sales', true, 0),
  ('closed_lost', 'Portfolio sent', 'sales', true, 1),
  ('closed_lost', 'Follow-up 1', 'sales', false, 2),
  ('closed_lost', 'Follow-up 2', 'sales', false, 3),
  ('closed_lost', 'Feedback captured', 'sales', false, 4),
  ('welcome', 'Welcome email sent', 'sales', true, 0),
  ('welcome', 'POC assigned', 'sales', true, 1),
  ('welcome', 'Advance invoice sent', 'sales', true, 2),
  ('agreement', 'Agreement signed', 'sales', true, 0),
  ('agreement', '50% advance received', 'sales', true, 1),
  ('profile_handover', 'Client profile/assets received', 'content', true, 0),
  ('timeline', 'Tech dev timeline set (weeks)', 'tech', true, 0),
  ('timeline', 'Content calendar set', 'content', true, 1),
  ('script_tech_flow', 'Script document ready', 'content', true, 0),
  ('script_tech_flow', 'Tech flow document ready', 'tech', true, 1),
  ('goal_measurement', 'KPIs/goals defined and confirmed', 'general', true, 0),
  ('onboarding', 'Pending payments cleared', 'sales', true, 0),
  ('onboarding', 'Disclosure form signed', 'sales', true, 1),
  ('onboarding', 'IP/confidentiality sign-off', 'sales', true, 2),
  ('onboarding', 'Feedback collected', 'general', false, 3),
  ('onboarding', 'Thank-you sent', 'general', true, 4);

-- OPTIONAL: Insert an initial Admin user so you can log in immediately after migration.
-- Password is 'password123' hashed with bcrypt.
INSERT INTO staff (full_name, email, password_hash, role) VALUES 
('Super Admin', 'admin@webbheads.com', '$2a$10$wE.Qy.o2c05ZlW9H.jI/sOjU62R/kE5Zt97J3LgHh.Z91hX7f7jA2', 'admin');
