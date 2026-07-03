# BUILD PROMPT — WCMS Phase 2: Client Portal

> This continues the existing WebbHeads Client Management System project (Next.js 14 + Supabase, staff portal already built). Paste this into Antigravity in the same project to add the Client Portal.

---

## Context
The staff portal (Admin/Tech Lead/Content Lead) already exists with: `staff`, `clients`, `pipeline_stages`, `projects`, `checklist_templates`, `project_checklist_items`, `payments`, `documents`, `activity_log` tables, and RLS policies keyed off a `current_staff_role()` helper function.

Run `supabase_migration_0002_client_portal.sql` first — it adds `client_type` to `clients`, new tracking columns to `projects`, and these new tables: `client_users`, `agreements`, `bank_settings`, `payment_requests`, `form_templates`, `form_responses`, `project_status_updates`, plus RLS policies using new helper functions `current_client_id()` and `is_client_role()`.

**One project per client** (confirmed) — no multi-project switcher needed. `client_type` is fixed at client creation but Admin can edit it manually later.

## What to build

### A. New role: `client`
- Client logs in via Supabase Auth like staff, but has a row in `client_users` (not `staff`), mapping to exactly one `client_id`.
- Add middleware: if the logged-in user has a `client_users` row, force all routes under `/portal/*` and block access to `/dashboard`, `/pipeline`, `/clients`, `/staff`, etc. Staff/admin should never land on `/portal`.

### B. Client Portal (`/portal`) — two modes

**Mode A: Sequential wizard, `/portal/onboarding` (steps 1-4)**
Render as a stepper. Each step's "Next" button is disabled until that step's completion condition is met (see below). Persist progress via the DB fields already added (don't use client-side-only state — if the client reloads or logs in from another device, they should land on the correct step).

Step routing logic (compute on load from DB state):
1. `welcome_seen_at is null` → show Step 1 (Welcome). On clicking Next, set `welcome_seen_at = now()`.
2. No `agreements` row with `client_agreed = true and signature_url is not null` → show Step 2 (Agreement). Render the PDF (`agreements.pdf_url`) inline (use `<iframe>` or a PDF viewer component). Checkbox writes `client_agreed = true, agreed_at = now()`. Signature upload widget writes to Supabase Storage, saves `signature_url, signature_uploaded_at`. Next enabled only when both are set.
3. No `payment_requests` row (`request_type='advance'`) with `status='approved'` → show Step 3 (Advance Payment).
   - Show `projects.project_value * projects.advance_percent / 100` as the amount due.
   - Fetch `bank_settings` (singleton row) and render the QR image + bank details.
   - File upload → sets `screenshot_url`, `status='submitted'`, `submitted_at=now()`.
   - If `status='submitted'`, show "Thank you — verifying, 1-2 hours" message, Next stays disabled.
   - If `status='rejected'`, show `rejection_reason` and allow re-upload (reset to allow new screenshot).
   - If `status='approved'`, Next is enabled. On first reaching `approved`, also auto-create the `final` payment_requests row if it doesn't exist yet: `amount = project_value - advance_amount`, `released = false`. (Do this via a Postgres trigger or in the approve API route — trigger is cleaner: `after update on payment_requests when status changes to 'approved' and request_type='advance'`.)
4. `profile_submitted_at is null` → show Step 4 (Profile Handover form).
   - Query `form_templates` where `scope = 'general' or scope = clients.client_type or (clients.client_type = 'both' and scope in ('tech','content'))`.
   - Render fields dynamically based on `field_type` (text/textarea/file/url/checkbox).
   - On submit: upsert one `form_responses` row per template, set `projects.profile_submitted_at = now()`.
   - Show "Thank you! We'll review and share your timeline shortly."
5. Once `profile_submitted_at` is set → redirect to `/portal/dashboard` (Mode B) permanently; the wizard route should never be reachable again for this project.

**Mode B: Status dashboard, `/portal/dashboard` (steps 5-8, not sequential)**
Show sections conditionally, each independent:
- **Timeline**: query `documents` where `project_id = this project and doc_type = 'timeline' and is_client_visible = true`. If none exist, show "Your timeline will appear here once it's ready." If exists, render/link it.
- **Final Invoice**: query the `payment_requests` row where `request_type='final'`. If it doesn't exist yet or `released = false`, don't show this section at all. If `released = true`, show the same payment UI pattern as Step 3 (amount, QR/bank details, screenshot upload, status messaging) scoped to this row.
- **Handles/Logins Collected**: if `projects.handles_collected = true`, show a simple confirmation card with `handles_collected_at`. Otherwise omit the section.
- **Project Tracking**: list `project_status_updates` where `project_id = this project and visible_to_client = true`, ordered by `posted_at desc`, as a simple timeline/feed.

Use Supabase Realtime subscriptions on `payment_requests`, `documents`, `project_status_updates`, and `projects` scoped to this `project_id` so all of the above update live without a refresh.

### C. New Admin-side screens

1. **Client creation form** — add a `client_type` select (Tech/Content/Both). Add a "Generate portal login" button on the client detail page that creates the `auth.users` account (via a server action using the service-role key) + the `client_users` row, and shows the generated credentials to Admin to share manually (no forced email flow needed yet).

2. **Agreements panel** (on `/projects/[id]`, new tab "Agreement") — Admin uploads the PDF (Supabase Storage) which creates/updates the `agreements` row. Shows `client_agreed` status, the signature image, and a "Send confirmation email" button (can just be a stub / mailto link for now — full email automation is out of scope for this pass).

3. **Payment Verification Queue** — new page `/payments/queue` (or a filter on an existing payments view) listing all `payment_requests` where `status = 'submitted'`, across all projects. Each row: client name, project, amount, screenshot preview, Approve / Reject buttons. Reject requires a short reason (`rejection_reason`).

4. **Bank Settings** — `/settings/bank` (admin only): edit UPI ID, upload/replace QR image, bank name, account holder, account number, IFSC. Single-row form (upsert into `bank_settings` id=1).

5. **Form Builder** — `/settings/forms` (admin only): CRUD for `form_templates`. Fields: scope (tech/content/general), label, field_type, is_required, sort_order. Simple table + add/edit dialog, drag-to-reorder if easy, otherwise a numeric sort_order input is fine for v1.

6. **Form Responses viewer** — new tab on `/projects/[id]` showing the client's submitted `form_responses` joined with `form_templates` for labels.

7. **Client Dashboard Controls** — new tab on `/projects/[id]` ("Client Portal") with:
   - Mark `handles_collected = true` (toggle/button, sets `handles_collected_at`)
   - "Release Final Invoice" button (sets `payment_requests.released = true, released_at = now()` on the `final` row — only enabled once that row exists, i.e. after advance approval)
   - Post a status update (textarea + "visible to client" checkbox → inserts into `project_status_updates`)
   - Quick view of which onboarding steps (1-4) the client has completed, computed from the same fields used in the portal routing logic

### D. Build order
1. Run `supabase_migration_0002_client_portal.sql`.
2. Set up Supabase Storage buckets: `agreements`, `signatures`, `payment-screenshots`, `bank-qr`, `form-uploads`, `timeline-docs` (or one general `client-uploads` bucket with folder-per-type — simpler, pick this unless you want per-bucket policies).
3. Build the `client` role middleware + `/portal` layout shell.
4. Build Step 1-4 wizard, one step at a time, testing each against a real seeded client before moving to the next.
5. Build Bank Settings + Form Builder (Admin) before wiring Steps 3 and 4, since the wizard depends on this data existing.
6. Build Mode B dashboard.
7. Build the six Admin-side screens in section C.
8. Wire Realtime subscriptions last, after all CRUD flows work with plain fetch/refetch.

Confirm the storage bucket strategy and the plan back to me before generating code, then proceed step by step rather than all at once.
