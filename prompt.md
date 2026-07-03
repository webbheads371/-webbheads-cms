# BUILD PROMPT — WebbHeads Client Management System (WCMS)

> Paste this whole prompt into your AI coding tool (Antigravity, Claude Code, Cursor, etc.) as the first message for a new project.

---

You are building **WebbHeads Client Management System (WCMS)** — an internal admin portal for a digital agency called WebbHeads. This is NOT a client-facing product; it is used only by WebbHeads staff (Admin, Tech Lead, Content Lead, Sales) to track client projects through a fixed delivery pipeline.

## Tech Stack (use exactly this)
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui components
- Supabase (Postgres + Auth + Storage + Realtime)
- Deployment target: Vercel
- Use `@supabase/ssr` for server/client Supabase clients (not the deprecated auth-helpers package)

## Roles (Supabase Auth + a `staff` table)
- `admin` — full access to everything, manages staff accounts, sees all payments.
- `tech_lead` — sees only projects they're assigned to; can edit checklist items tagged `tech` and `general`.
- `content_lead` — sees only projects they're assigned to; can edit checklist items tagged `content` and `general`.
- `sales` — manages quotation → agreement stages, invoices, payments; can edit items tagged `sales`.

Admin creates staff accounts manually (invite flow: admin adds email + role, staff sets password on first login via Supabase magic link or invite).

## Core Domain Model

A **Client** (company) has one or more **Projects** (a project = one pipeline instance / one deal).

### Fixed pipeline stages (in order)
0. `quotation` — Quotation / Proposal / Analytics / Demo
1. `welcome` — Welcome Letter / Mail
2. `agreement` — Agreement + Payment (50% advance)
3. `profile_handover` — Profile Handover
4. `timeline` — Timeline Document (tech weeks + content calendar)
5. `script_tech_flow` — Script Document (content) + Tech Flow Document (tech)
6. `goal_measurement` — Goal Measurement
7. `onboarding` — Onboarding / Close-out
- Terminal states: `closed_won`, `closed_lost`

If the client says "no" at stage 0, the project moves straight to `closed_lost` with its own checklist (thank-you sent, portfolio sent, follow-up 1, follow-up 2, feedback captured) instead of continuing the numbered pipeline.

### Checklist items per stage (seed exactly this data)
```
quotation:        Quotation sent [sales], Client decision Y/N [sales]
closed_lost:       Thank-you message sent [sales], Portfolio sent [sales], Follow-up 1 [sales], Follow-up 2 [sales], Feedback captured [sales]
welcome:           Welcome email sent [sales], POC assigned [sales], Advance invoice sent [sales]
agreement:         Agreement signed [sales], 50% advance received [sales]
profile_handover:  Client profile/assets received [content]
timeline:          Tech dev timeline set - weeks [tech], Content calendar set [content]
script_tech_flow:  Script document ready [content], Tech flow document ready [tech]
goal_measurement:  KPIs/goals defined and confirmed [general]
onboarding:        Pending payments cleared [sales], Disclosure form signed [sales], IP/confidentiality sign-off [sales], Feedback collected [general], Thank-you sent [general]
```

A project cannot move to the next stage in the UI unless all `is_required` checklist items in the current stage are checked — BUT admin can force-move with a confirmation dialog ("Some required items are incomplete. Move anyway?").

## Database Schema (Supabase / Postgres)

Create a SQL migration with these tables:

```sql
-- Staff / internal users
create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role text not null check (role in ('admin','tech_lead','content_lead','sales')),
  created_at timestamptz default now()
);

-- Clients (companies)
create table clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  source text, -- how they found WebbHeads
  created_at timestamptz default now(),
  created_by uuid references staff(id)
);

-- Pipeline stage lookup (static reference data)
create table pipeline_stages (
  key text primary key,       -- 'quotation','welcome',...,'closed_won','closed_lost'
  label text not null,
  sort_order int not null
);

-- Projects (one pipeline instance per client deal)
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  name text not null,          -- e.g. "Website Redesign - ABC Traders"
  current_stage text references pipeline_stages(key) not null default 'quotation',
  status text not null default 'active' check (status in ('active','closed_won','closed_lost')),
  tech_lead_id uuid references staff(id),
  content_lead_id uuid references staff(id),
  project_value numeric,
  advance_percent numeric default 50,
  created_at timestamptz default now(),
  expected_close_date date
);

-- Checklist item templates per stage (seed data)
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  stage_key text references pipeline_stages(key) not null,
  label text not null,
  category text not null check (category in ('tech','content','sales','general')),
  is_required boolean default true,
  sort_order int not null
);

-- Actual checklist state per project (instantiated from templates when project enters a stage)
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

-- Payments log
create table payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  amount numeric not null,
  payment_type text check (payment_type in ('advance','partial','final')),
  method text,          -- UPI, bank transfer, etc.
  paid_on date not null,
  note text,
  recorded_by uuid references staff(id),
  created_at timestamptz default now()
);

-- Documents (links or storage refs)
create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  doc_type text not null,  -- agreement, invoice, profile, timeline, script, tech_flow, disclosure, ip_signoff, other
  title text not null,
  url text,                -- external link (Drive/Docs) OR Supabase Storage path
  uploaded_by uuid references staff(id),
  uploaded_at timestamptz default now()
);

-- Activity log (audit trail / timeline feed)
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  actor_id uuid references staff(id),
  action text not null,   -- 'stage_changed','checklist_ticked','payment_added','document_uploaded'
  detail jsonb,
  created_at timestamptz default now()
);
```

Also write the **seed insert statements** for `pipeline_stages` and `checklist_templates` using the exact data listed above.

## Row-Level Security (RLS)
Enable RLS on all tables. Rules:
- `admin` role: full read/write on everything.
- `tech_lead` / `content_lead`: can only `select` projects where `tech_lead_id = auth.uid()` or `content_lead_id = auth.uid()`; can only `update` `project_checklist_items` rows where `category` matches their domain (`tech`→tech_lead, `content`→content_lead, `general`→either) AND the item belongs to a project they're assigned to.
- `sales`: can `select`/`update` all projects' `sales`-category checklist items and manage `payments`, `clients`, and stage `quotation`/`welcome`/`agreement`/`onboarding`.
- Write a Postgres helper function `current_staff_role()` that reads the role from the `staff` table for `auth.uid()`, and use it in policies instead of repeating subqueries.

## Pages / Routes (App Router)

```
/login                          - Supabase auth login form
/                                - redirect to /dashboard
/dashboard                       - KPI cards + funnel chart (projects per stage) + pending payments total
/pipeline                        - Kanban board, columns = stages, drag-and-drop cards (disable drag for non-admin unless it's their assigned project)
/clients                         - table of all clients, "New client" button
/clients/[id]                    - client detail + list of their projects
/projects/new                    - create project form (pick client, name, assign tech/content lead, project value)
/projects/[id]                   - project detail page:
    - header: client name, current stage badge, status, assigned staff
    - checklist for current stage (checkboxes, role-gated editing)
    - stage progress stepper (all 8 stages, current highlighted)
    - "Move to next stage" button (blocked with warning if required items incomplete)
    - payments tab (list + add payment form)
    - documents tab (list + add document link/upload)
    - activity timeline (auto-generated from activity_log)
/staff                           - admin-only: list staff, invite new staff, change roles
/settings                        - admin-only: edit checklist templates per stage (optional stretch goal)
```

## UI/UX requirements
- Clean, functional admin-panel look — sidebar nav (Dashboard, Pipeline, Clients, Staff, Settings), top bar with logged-in user + role badge + logout.
- Use shadcn/ui `Table`, `Card`, `Badge`, `Dialog`, `Checkbox`, `Tabs`, `DropdownMenu` components.
- Kanban board: use a lightweight drag-and-drop lib (`@dnd-kit/core`) — do not build DnD from scratch.
- Mobile responsive: sidebar collapses to a bottom nav or hamburger on small screens; project detail page checklist must be usable on a phone.
- Use Supabase Realtime subscriptions on the `projects` and `project_checklist_items` tables so the Kanban board and project detail page update live when another staff member makes a change.
- Loading and empty states everywhere (no blank screens).

## Environment / Config
- `.env.local` needs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, used for staff invite flow).
- Add a `README.md` with setup steps: create Supabase project, run migration SQL, set env vars, `npm install`, `npm run dev`.

## Build order (do this step by step, don't try to generate everything in one shot)
1. Scaffold Next.js 14 + TypeScript + Tailwind + shadcn/ui project.
2. Set up Supabase client utilities (`lib/supabase/client.ts`, `lib/supabase/server.ts`) using `@supabase/ssr`.
3. Write the full SQL migration (schema + seed data + RLS policies) as `supabase/migrations/0001_init.sql`.
4. Build auth: login page + middleware that protects all routes except `/login`.
5. Build the sidebar layout + dashboard page with placeholder data first, then wire to Supabase.
6. Build Clients list + client detail + new project form.
7. Build the Pipeline Kanban board with drag-and-drop stage changes.
8. Build the Project detail page (checklist, stepper, payments tab, documents tab, activity timeline).
9. Build Staff management page (admin only).
10. Wire up Supabase Realtime subscriptions.
11. Polish mobile responsiveness and loading/empty states.

Confirm the plan back to me before generating code for steps 3 onward, so I can review the schema first.

## Planned v2 (do not build now, but keep schema/routing open for it)
After the staff portal (steps 1-11 above) is stable, we will add a **read-only client login**. Design decisions now that make that easier later:
- Keep all staff routes under no particular prefix but plan a future `/portal/*` route group reserved for clients (don't use that path for anything else).
- Add `documents.is_client_visible boolean default false` to the documents table now, even though nothing uses it yet.
- Keep `clients` and `staff`/`auth.users` cleanly separated (don't assume every `auth.users` row is staff) — this makes adding a `client_users` table later a clean additive migration instead of a rewrite.
