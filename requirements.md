# WebbHeads Client Management System (WCMS) — Requirements

## 1. Overview

**Project name:** WebbHeads Client Management System (WCMS)
**Type:** Internal admin panel / staff portal (not public-facing)
**Purpose:** Track every client from first quotation to project close-out, following WebbHeads' fixed delivery pipeline. Staff (Admin, Tech Lead, Content Lead) log in, get assigned to a client's project, and update stage checklists, payments, and documents as work progresses.

**Users of this system:** WebbHeads internal team only.
- **Admin (Kushal / CXO)** — full access, creates accounts, creates projects, sees all payments.
- **Tech Lead** — sees projects assigned to them, updates tech-related stages/checklist items.
- **Content Lead** — sees projects assigned to them, updates content-related stages/checklist items.
- **Sales/Ops (optional role)** — manages quotation → agreement stages, invoices, payments.

Clients do **not** log in for v1. (Optional client-facing read-only status page can be a v2 feature — see §9.)

---

## 2. Core Pipeline (fixed, must match exactly)

```
Stage 0  Quotation / Proposal / Analytics / Demo
              │
        ┌─────┴─────┐
        NO           YES
        │             │
   Thank you      Stage 1  Welcome Letter / Mail
   + Portfolio         - Next process notified
   + Follow-ups        - POC (Point of Contact) assigned
   + Feedback          - Invoice of advance sent
   (deal closed-lost)     │
                     Stage 2  Agreement + Payment (50% advance)
                          │
                     Stage 3  Profile Handover
                          │
                     Stage 4  Timeline Document
                          - Tech development timeline (in weeks)
                          - Content calendar
                          │
                     Stage 5  Script Document (content) + Tech Flow Document (tech)
                          │
                     Stage 6  Goal Measurement (checklist ✓/✗)
                          │
                     Stage 7  Onboarding / Close-out
                          - Pending payments cleared
                          - Disclosure form signed
                          - IP sign-off (confidentiality)
                          - Feedback + thank you
                     (deal closed-won)
```

Each stage has a fixed **checklist** of sub-items. A deal cannot move to the next stage until required checklist items in the current stage are marked complete (soft gate — admin can override).

---

## 3. Functional Requirements

### 3.1 Authentication & Roles
- Email/password login (Supabase Auth).
- Roles: `admin`, `tech_lead`, `content_lead`, `sales`.
- Admin creates staff accounts (invite by email) and assigns roles.
- Role-based visibility: Tech Lead only sees/edits tech-flagged checklist items on their assigned projects; Content Lead only sees/edits content-flagged items. Admin sees/edits everything.

### 3.2 Client & Project Management
- Admin creates a **Client** record (company name, contact person, phone, email, source).
- Admin creates a **Project/Deal** under a client — this is the pipeline instance.
- Assign a Tech Lead and/or Content Lead to a project.
- Project has: current stage, status (`active`, `closed_won`, `closed_lost`), created date, expected close date.

### 3.3 Pipeline / Kanban View
- Board view: columns = the 8 stages (+ closed-lost). Cards = projects.
- Drag-and-drop a card to move stages (only if required checklist items are done, or admin override).
- Filter by assigned staff, status, date range.

### 3.4 Checklist Engine (per stage)
- Each stage ships with a predefined checklist (see §4 seed data).
- Checklist item fields: label, category (`tech`/`content`/`sales`/`general`), is_required, is_done, done_by, done_at, notes.
- Staff can check off items relevant to their role; activity is logged.

### 3.5 Payments
- Track: total project value, advance % (default 50%), advance amount, advance received (Y/N + date), pending balance, final payment received (Y/N + date).
- Simple payment log (manual entries — amount, date, method, note). No payment gateway integration in v1.
- Dashboard shows outstanding/pending payments across all active projects.

### 3.6 Documents
- Each project has a documents section: links (Google Drive/Docs URLs) or uploaded files (Supabase Storage) for: Agreement, Invoice, Profile handover doc, Timeline doc, Script doc, Tech flow doc, Disclosure form, IP sign-off doc.
- Simple list with type, uploaded_by, uploaded_at, link/file.

### 3.7 Activity Log / Timeline
- Every stage change, checklist tick, payment entry, and document upload is logged per project with timestamp + actor, shown as a vertical timeline on the project detail page.

### 3.8 Dashboard (Admin home)
- Total active projects, projects per stage (funnel chart), overdue checklist items, pending payments total, recently closed-won/lost.

### 3.9 Closed-Lost Flow
- If a lead says "no" at Stage 0, project moves to `closed_lost` with sub-checklist: Thank-you sent, Portfolio sent, Follow-up 1 date, Follow-up 2 date, Feedback captured.

---

## 4. Seed Data — Stages & Checklist Items

| Stage # | Stage Key | Label | Checklist items (category) |
|---|---|---|---|
| 0 | `quotation` | Quotation / Proposal / Demo | Quotation sent (sales), Client decision Y/N (sales) |
| — | `closed_lost` | Not proceeding | Thank-you message sent (sales), Portfolio sent (sales), Follow-up 1 (sales), Follow-up 2 (sales), Feedback captured (sales) |
| 1 | `welcome` | Welcome Letter / Mail | Welcome email sent (sales), POC assigned (sales), Advance invoice sent (sales) |
| 2 | `agreement` | Agreement + Payment | Agreement signed (sales), 50% advance received (sales) |
| 3 | `profile_handover` | Profile Handover | Client profile/assets received (content) |
| 4 | `timeline` | Timeline Document | Tech dev timeline set — weeks (tech), Content calendar set (content) |
| 5 | `script_tech_flow` | Script + Tech Flow | Script document ready (content), Tech flow document ready (tech) |
| 6 | `goal_measurement` | Goal Measurement | KPIs/goals defined and confirmed (general) |
| 7 | `onboarding` | Onboarding / Close-out | Pending payments cleared (sales), Disclosure form signed (sales), IP/confidentiality sign-off (sales), Feedback collected (general), Thank-you sent (general) |

This table is the source of truth for the seed migration script.

---

## 5. Non-Functional Requirements
- Mobile-responsive (staff will check updates from phone).
- Realtime updates (Supabase Realtime) so if Tech Lead ticks an item, Admin's board updates live.
- Simple, fast — this is an internal tool, not a marketing site. Prioritize clarity over decoration.
- Data isolation not required (single organization/internal tool), but structure tables so multi-tenant expansion (other agencies using WCMS as a SaaS) is possible later.

---

## 6. Out of Scope (v1)
- Payment gateway integration (Razorpay/Stripe) — v2
- Automated email/WhatsApp notifications — v2 (structure DB to support it later)
- Multi-tenant SaaS billing — v2/v3

## 6a. v2 Feature — Client Portal (confirmed, build after v1 staff portal is stable)

Clients get their own read-only login to check status without messaging WebbHeads directly.

**New role:** `client` — logs in via Supabase Auth like staff, but is scoped to their own project(s) only, not the `staff` table.

**New table:**
```sql
create table client_users (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  created_at timestamptz default now()
);
```

**RLS pattern:** a `client` role can `select` from `projects`, `project_checklist_items`, `payments`, and `documents` only where `project.client_id = (select client_id from client_users where id = auth.uid())`. No insert/update rights anywhere except maybe a "leave feedback" field at the `onboarding` stage.

**What the client sees (read-only):**
- Current stage of their project, shown as the same 8-step stepper staff see, but simplified (no internal checklist labels — just "In Progress" / "Done" per stage).
- Payment summary: total value, advance status, pending balance, payment history (amount + date only, no internal notes).
- Documents shared with them (only docs where you explicitly mark `is_client_visible = true` — add this boolean column to `documents` table).
- A simple feedback form unlocked at the `onboarding` stage.

**What the client does NOT see:** other clients, staff assignments, checklist notes, internal activity log.

**Access creation flow:** Admin generates a client login from the `/clients/[id]` page ("Give portal access" button) — creates the `auth.users` row + `client_users` row, sends an invite email via Supabase Auth.

**New route group:** `/portal/*` (separate from `/dashboard`, `/pipeline`, etc. which stay staff-only) — e.g. `/portal/project` showing that client's single active project. Middleware checks role and redirects `client` role users to `/portal/project` and blocks them from all staff routes.

Add `documents.is_client_visible boolean default false` to the migration when you build this phase, and add the `client_users` table + its RLS policies as a follow-up migration (`0002_client_portal.sql`) rather than editing the v1 migration.

---

## 7. Tech Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Matches your existing CRM stack, you already have working patterns to copy from |
| Styling | Tailwind CSS + shadcn/ui | Fast to build admin UI, consistent with your other projects |
| Backend/DB | Supabase (Postgres) | See §8 — best fit given your context |
| Auth | Supabase Auth (email/password) | Built-in, RLS-friendly, no extra service needed |
| File storage | Supabase Storage | For document uploads |
| Realtime | Supabase Realtime | Live Kanban updates across staff |
| Hosting | Vercel | Matches your existing deployment pattern (webbheads.com already on Vercel) |

---

## 8. Backend Recommendation: Supabase vs Alternatives

**Recommendation: Supabase.** Reasons specific to your situation:

1. **You already know it** — you've built the real estate CRM, LeadCore, GITAM journal system, and Lifecore OS all on Supabase. Zero new learning curve, and you can literally copy auth/RLS patterns from those projects.
2. **Relational data fits this use case** — clients → projects → stages → checklist items → payments is a genuinely relational structure. Postgres (what Supabase runs) handles this far better than a NoSQL store like Firebase.
3. **Row-Level Security (RLS)** — lets you enforce "Tech Lead only sees their assigned projects/tech items" directly in the database, not just in frontend code. This matters because it's a real internal tool with role separation.
4. **Realtime out of the box** — needed for the live Kanban board.
5. **Free tier is enough** for an internal tool with a handful of staff and a few dozen active projects at a time.
6. **Storage + Auth + DB in one project** — no need to stitch together three separate services.

**Alternatives considered:**
- **Firebase/Firestore** — good realtime, but NoSQL makes the relational checklist/stage/payment structure awkward, and you'd be learning a new mental model.
- **PocketBase** — lightweight, self-hosted, single Go binary, decent for small internal tools, but weaker ecosystem, no managed hosting, you'd own the server/backups yourself.
- **Custom Node/Express + Postgres** — full control, but pure overhead for a tool this size — you'd rebuild auth, RLS-equivalent, storage, and realtime from scratch.
- **Airtable-as-backend** — fastest to prototype, but not a real product, poor for role-based access control and long-term ownership.

Given you're already standardized on Supabase + Next.js + Vercel across WebbHeads projects, staying on that stack for WCMS keeps your codebase, auth patterns, and deployment pipeline consistent — use `prompt.md` in this same folder to generate the app.
