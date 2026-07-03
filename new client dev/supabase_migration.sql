-- ============================================================
-- WebbHeads Client Management System (WCMS)
-- Initial migration: schema + seed data + RLS policies
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Tables ----------

create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role text not null check (role in ('admin','tech_lead','content_lead','sales')),
  created_at timestamptz default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  source text,
  created_at timestamptz default now(),
  created_by uuid references staff(id)
);

create table pipeline_stages (
  key text primary key,
  label text not null,
  sort_order int not null
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  current_stage text references pipeline_stages(key) not null default 'quotation',
  status text not null default 'active' check (status in ('active','closed_won','closed_lost')),
  tech_lead_id uuid references staff(id),
  content_lead_id uuid references staff(id),
  project_value numeric,
  advance_percent numeric default 50,
  created_at timestamptz default now(),
  expected_close_date date
);

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  stage_key text references pipeline_stages(key) not null,
  label text not null,
  category text not null check (category in ('tech','content','sales','general')),
  is_required boolean default true,
  sort_order int not null
);

create table project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  template_id uuid references checklist_templates(id),
  stage_key text references pipeline_stages(key) not null,
  label text not null,
  category text not null,
  is_required boolean not null,
  is_done boolean default false,
  done_by uuid references staff(id),
  done_at timestamptz,
  notes text
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  amount numeric not null,
  payment_type text check (payment_type in ('advance','partial','final')),
  method text,
  paid_on date not null,
  note text,
  recorded_by uuid references staff(id),
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  doc_type text not null,
  title text not null,
  url text,
  uploaded_by uuid references staff(id),
  uploaded_at timestamptz default now(),
  is_client_visible boolean default false -- reserved for v2 client portal
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  actor_id uuid references staff(id),
  action text not null,
  detail jsonb,
  created_at timestamptz default now()
);

-- ---------- Seed: pipeline stages ----------

insert into pipeline_stages (key, label, sort_order) values
  ('quotation',        'Quotation / Proposal / Analytics / Demo', 0),
  ('welcome',          'Welcome Letter / Mail',                   1),
  ('agreement',        'Agreement + Payment',                     2),
  ('profile_handover', 'Profile Handover',                        3),
  ('timeline',         'Timeline Document',                       4),
  ('script_tech_flow', 'Script + Tech Flow Document',              5),
  ('goal_measurement', 'Goal Measurement',                        6),
  ('onboarding',       'Onboarding / Close-out',                  7),
  ('closed_won',       'Closed - Won',                            8),
  ('closed_lost',      'Closed - Lost',                           9);

-- ---------- Seed: checklist templates ----------

insert into checklist_templates (stage_key, label, category, is_required, sort_order) values
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

-- ---------- Helper function for RLS ----------

create or replace function current_staff_role()
returns text
language sql
security definer
stable
as $$
  select role from staff where id = auth.uid();
$$;

create or replace function is_project_assignee(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from projects
    where id = p_project_id
      and (tech_lead_id = auth.uid() or content_lead_id = auth.uid())
  );
$$;

-- ---------- Enable RLS ----------

alter table staff enable row level security;
alter table clients enable row level security;
alter table pipeline_stages enable row level security;
alter table projects enable row level security;
alter table checklist_templates enable row level security;
alter table project_checklist_items enable row level security;
alter table payments enable row level security;
alter table documents enable row level security;
alter table activity_log enable row level security;

-- ---------- Policies ----------

-- staff: everyone can read staff directory; only admin can write
create policy staff_select on staff for select using (true);
create policy staff_admin_write on staff for all using (current_staff_role() = 'admin');

-- pipeline_stages / checklist_templates: read-only reference data, all logged-in staff can read
create policy stages_select on pipeline_stages for select using (auth.uid() is not null);
create policy templates_select on checklist_templates for select using (auth.uid() is not null);
create policy stages_admin_write on pipeline_stages for all using (current_staff_role() = 'admin');
create policy templates_admin_write on checklist_templates for all using (current_staff_role() = 'admin');

-- clients: admin + sales full access, tech/content leads read-only
create policy clients_select on clients for select using (auth.uid() is not null);
create policy clients_write on clients for insert with check (current_staff_role() in ('admin','sales'));
create policy clients_update on clients for update using (current_staff_role() in ('admin','sales'));

-- projects: admin sees all; tech/content lead see only assigned; sales sees all (needs pipeline visibility)
create policy projects_select on projects for select using (
  current_staff_role() in ('admin','sales')
  or tech_lead_id = auth.uid()
  or content_lead_id = auth.uid()
);
create policy projects_insert on projects for insert with check (current_staff_role() in ('admin','sales'));
create policy projects_update on projects for update using (
  current_staff_role() in ('admin','sales')
  or tech_lead_id = auth.uid()
  or content_lead_id = auth.uid()
);

-- project_checklist_items: visibility follows project assignment; edit gated by category vs role
create policy checklist_select on project_checklist_items for select using (
  current_staff_role() in ('admin','sales')
  or is_project_assignee(project_id)
);
create policy checklist_update on project_checklist_items for update using (
  current_staff_role() = 'admin'
  or (current_staff_role() = 'sales' and category = 'sales')
  or (current_staff_role() = 'tech_lead' and category in ('tech','general') and is_project_assignee(project_id))
  or (current_staff_role() = 'content_lead' and category in ('content','general') and is_project_assignee(project_id))
);
create policy checklist_insert on project_checklist_items for insert with check (
  current_staff_role() in ('admin','sales')
);

-- payments: admin + sales manage, tech/content leads read-only on their assigned projects
create policy payments_select on payments for select using (
  current_staff_role() in ('admin','sales') or is_project_assignee(project_id)
);
create policy payments_write on payments for insert with check (current_staff_role() in ('admin','sales'));
create policy payments_update on payments for update using (current_staff_role() in ('admin','sales'));

-- documents: any assigned staff can upload/read; admin/sales see all
create policy documents_select on documents for select using (
  current_staff_role() in ('admin','sales') or is_project_assignee(project_id)
);
create policy documents_write on documents for insert with check (
  current_staff_role() in ('admin','sales') or is_project_assignee(project_id)
);

-- activity_log: read-only feed, visible to anyone who can see the project; system/staff inserts
create policy activity_select on activity_log for select using (
  current_staff_role() in ('admin','sales') or is_project_assignee(project_id)
);
create policy activity_insert on activity_log for insert with check (auth.uid() is not null);

-- ============================================================
-- End of migration
-- ============================================================
