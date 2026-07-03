-- ============================================================
-- WebbHeads Client Management System (WCMS)
-- Migration 0002: Client Portal (Phase 2)
-- Run this AFTER supabase_migration.sql (Phase 1) has already run.
-- ============================================================

-- ---------- Alter existing tables ----------

alter table clients
  add column client_type text not null default 'both'
    check (client_type in ('tech','content','both'));

alter table projects
  add column welcome_seen_at timestamptz,
  add column profile_submitted_at timestamptz,
  add column handles_collected boolean default false,
  add column handles_collected_at timestamptz;

-- ---------- Client login mapping ----------

create table client_users (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade not null,
  full_name text not null,
  email text unique not null,
  created_at timestamptz default now(),
  created_by uuid references staff(id)
);

-- ---------- Agreement (Step 2) ----------

create table agreements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null unique,
  pdf_url text not null,
  uploaded_by uuid references staff(id),
  uploaded_at timestamptz default now(),
  client_agreed boolean default false,
  agreed_at timestamptz,
  signature_url text,
  signature_uploaded_at timestamptz,
  confirmation_email_sent boolean default false,
  confirmation_email_sent_at timestamptz
);

-- ---------- Bank / UPI settings (single company-wide record) ----------

create table bank_settings (
  id int primary key default 1 check (id = 1), -- singleton row
  upi_id text,
  qr_image_url text,
  bank_name text,
  account_holder text,
  account_number text,
  ifsc text,
  updated_by uuid references staff(id),
  updated_at timestamptz default now()
);

insert into bank_settings (id) values (1); -- seed the single row, fields filled in later via admin UI

-- ---------- Payment requests (advance + final, Steps 3 & 6) ----------

create table payment_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  request_type text not null check (request_type in ('advance','final')),
  amount numeric not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','submitted','approved','rejected')),
  screenshot_url text,
  submitted_at timestamptz,
  verified_by uuid references staff(id),
  verified_at timestamptz,
  rejection_reason text,
  released boolean default false,   -- only meaningful for 'final' type: hidden from client until Admin releases it
  released_by uuid references staff(id),
  released_at timestamptz,
  created_at timestamptz default now(),
  unique (project_id, request_type)  -- one advance + one final request per project
);

-- ---------- Dynamic form builder (Step 4) ----------

create table form_templates (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('tech','content','general')),
  label text not null,
  field_type text not null check (field_type in ('text','textarea','file','url','checkbox')),
  is_required boolean default true,
  sort_order int not null default 0,
  created_by uuid references staff(id),
  created_at timestamptz default now()
);

create table form_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  template_id uuid references form_templates(id) not null,
  value text,  -- text/url/checkbox answers as text; file answers store the Supabase Storage path/URL
  submitted_at timestamptz default now(),
  unique (project_id, template_id)
);

-- ---------- Project status updates (Step 8 - "project running / tracking") ----------

create table project_status_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  message text not null,
  posted_by uuid references staff(id),
  posted_at timestamptz default now(),
  visible_to_client boolean default true
);

-- ---------- Helper: get the client_id for the logged-in client user ----------

create or replace function current_client_id()
returns uuid
language sql
security definer
stable
as $$
  select client_id from client_users where id = auth.uid();
$$;

create or replace function is_client_role()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from client_users where id = auth.uid());
$$;

-- ---------- Enable RLS on all new tables ----------

alter table client_users enable row level security;
alter table agreements enable row level security;
alter table bank_settings enable row level security;
alter table payment_requests enable row level security;
alter table form_templates enable row level security;
alter table form_responses enable row level security;
alter table project_status_updates enable row level security;

-- ---------- Policies: client_users ----------
-- Admin manages all client login records; a client can read only their own row.

create policy client_users_admin_all on client_users for all
  using (current_staff_role() = 'admin');

create policy client_users_self_select on client_users for select
  using (id = auth.uid());

-- ---------- Policies: agreements ----------
-- Staff (admin/sales) manage; client can select/update ONLY their own project's agreement,
-- and only the client_agreed / signature_url / agreed_at / signature_uploaded_at fields in practice
-- (enforce field-level restriction in the app layer / a Postgres function if needed).

create policy agreements_staff_all on agreements for all
  using (current_staff_role() in ('admin','sales') or is_project_assignee(project_id));

create policy agreements_client_select on agreements for select
  using (is_client_role() and project_id in (
    select id from projects where client_id = current_client_id()
  ));

create policy agreements_client_update on agreements for update
  using (is_client_role() and project_id in (
    select id from projects where client_id = current_client_id()
  ));

-- ---------- Policies: bank_settings ----------
-- Admin edits; everyone logged in (staff or client) can read (client needs it to pay).

create policy bank_settings_select on bank_settings for select
  using (auth.uid() is not null);

create policy bank_settings_admin_write on bank_settings for all
  using (current_staff_role() = 'admin');

-- ---------- Policies: payment_requests ----------

create policy payment_requests_staff_all on payment_requests for all
  using (current_staff_role() in ('admin','sales') or is_project_assignee(project_id));

create policy payment_requests_client_select on payment_requests for select
  using (
    is_client_role()
    and project_id in (select id from projects where client_id = current_client_id())
    and (request_type = 'advance' or released = true) -- final invoice hidden until released
  );

create policy payment_requests_client_update on payment_requests for update
  using (
    is_client_role()
    and project_id in (select id from projects where client_id = current_client_id())
  );
  -- App layer should only allow the client to set: screenshot_url, status='submitted', submitted_at
  -- Approving/rejecting/releasing remains staff-only via the staff policy above.

-- ---------- Policies: form_templates ----------
-- Admin manages; all logged-in users (staff + client) can read (client needs it to render the form).

create policy form_templates_select on form_templates for select
  using (auth.uid() is not null);

create policy form_templates_admin_write on form_templates for all
  using (current_staff_role() = 'admin');

-- ---------- Policies: form_responses ----------

create policy form_responses_staff_select on form_responses for select
  using (current_staff_role() in ('admin','sales') or is_project_assignee(project_id));

create policy form_responses_client_select on form_responses for select
  using (is_client_role() and project_id in (
    select id from projects where client_id = current_client_id()
  ));

create policy form_responses_client_insert on form_responses for insert
  with check (is_client_role() and project_id in (
    select id from projects where client_id = current_client_id()
  ));

-- ---------- Policies: project_status_updates ----------

create policy status_updates_staff_all on project_status_updates for all
  using (current_staff_role() in ('admin','sales') or is_project_assignee(project_id));

create policy status_updates_client_select on project_status_updates for select
  using (
    is_client_role()
    and visible_to_client = true
    and project_id in (select id from projects where client_id = current_client_id())
  );

-- ---------- Policies: extend existing tables for client read access ----------
-- Client needs to read their own project row and their own client row and client-visible documents.

create policy projects_client_select on projects for select
  using (is_client_role() and client_id = current_client_id());

create policy clients_client_select on clients for select
  using (is_client_role() and id = current_client_id());

create policy documents_client_select on documents for select
  using (
    is_client_role()
    and is_client_visible = true
    and project_id in (select id from projects where client_id = current_client_id())
  );

-- ============================================================
-- End of migration 0002
-- ============================================================
