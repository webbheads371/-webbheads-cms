# WebbHeads Client Management System (WCMS) — Requirements (v2: Client Portal added)

This is the full requirements doc: **Phase 1 (Staff Portal)** — already scoped/built — plus **Phase 2 (Client Portal)**, detailed fully below per confirmed decisions.

---

## PHASE 1 — Staff Portal (recap, already scoped)

Admin creates Clients → creates Projects → assigns Tech Lead / Content Lead → staff move projects through the 8-stage pipeline (Quotation → Welcome → Agreement → Profile Handover → Timeline → Script/Tech Flow → Goal Measurement → Onboarding) via a Kanban board + per-stage checklists. Payments, documents, and activity log tracked per project. Full detail in the original `requirements.md` / `supabase_migration.sql` already generated — unchanged, still the backbone Admin/staff work from.

**Confirmed decisions for Phase 2** (locked in, reflected in schema below):
- **One project per client.** No multi-project switcher needed in the client portal.
- **Client type (Tech / Content / Both)** is set when the client is created, but Admin can edit it manually later if scope changes.
- **Final/pending invoice** is auto-calculated (`project_value - advance_amount`) the moment the advance is approved, but stays hidden from the client until Admin manually clicks "Release" — Admin controls timing, not amount entry.

---

## PHASE 2 — Client Portal

### 2.1 Client Login
- Admin generates login credentials when creating a client (or afterward from the client detail page) — email + password (or invite link), stored via Supabase Auth.
- Client logs into a separate route (`/portal`), sees only their own data.
- Client's name is shown throughout ("Welcome, [Client Name]").

### 2.2 The flow has two distinct modes:

**Mode A — Sequential Wizard (Steps 1-4):** client-driven, gated by a "Next" button, must complete in order.

**Mode B — Admin-Populated Dashboard (Steps 5-8):** after Step 4, the client portal goes to a holding/waiting screen. From then on, sections appear on the client's dashboard **only when Admin uploads/releases them** — no more Next-button gating, no fixed order. It behaves like a live status board that fills in over time.

---

### STEP 1 — Welcome
- Personalized welcome screen: "Welcome, [Client Name], to WebbHeads" + short onboarding blurb.
- Single **Next** button. (Track `welcome_seen_at` on the project so Admin can see whether the client has even logged in yet.)

### STEP 2 — Agreement
- Admin uploads the **agreement PDF** for this client from the admin panel (Agreements section on the project page).
- Client sees the PDF rendered inline in the portal (no forced download).
- Client checks **"I agree to the agreement"** → writes `client_agreed = true`, `agreed_at = now()` → visible instantly in the admin panel.
- Client uploads a **signature** (image file) → stored, shown in the admin panel next to that client's project, tagged with their client type (Tech/Content/Both) for context.
- On agreement + signature, Admin panel sends a confirmation email (manual trigger button for v2 — can automate later).
- Next button unlocks only once both `client_agreed = true` and a signature file exists.

### STEP 3 — Advance Payment (50%)
- Client sees: **total contract value**, and the **advance amount auto-calculated** from `projects.advance_percent` (default 50%) — e.g. ₹25,000 total → ₹12,500 due.
- Client sees the **UPI QR code image + bank details** — pulled from a single, Admin-editable **Bank Settings** record (not per-client — one company-wide QR/bank detail set, editable anytime from Admin Settings).
- Client uploads a **payment screenshot** (required — Next button stays disabled with no screenshot).
- On upload: status becomes `submitted`, client sees **"Thank you — we're verifying, we'll update you within 1–2 hours."**
- **Admin manually reviews** the screenshot in a "Payment Verification Queue" (Admin panel) and clicks **Approve** or **Reject**.
  - Approve → `status = 'approved'`, Next button unlocks for the client.
  - Reject → `status = 'rejected'`, client sees a message asking them to re-upload, Next stays locked.
- The moment advance is approved, the system auto-calculates the **final/pending invoice amount** (`project_value - advance_amount`) and creates it in a **hidden** state — Admin decides later when to reveal it (see Step 6).

### STEP 4 — Client Profile Handover (dynamic form)
- The form shown depends on the client's `client_type` (Tech / Content / Both), which Admin set when creating the client.
- **Admin builds/edits these form questions** from an Admin Settings screen — a native form builder (not Google Forms): add, edit, delete, reorder questions, mark required/optional, set field type (text, long text, file upload, URL, checkbox).
  - Example Content-type questions: Instagram handle, brand logo upload, brand colors, content tone notes.
  - Example Tech-type questions: hosting provider, Cloudflare login, domain registrar, existing site URL.
  - Questions tagged `general` show for every client type; `tech`-tagged show for Tech/Both; `content`-tagged show for Content/Both.
- Client fills and submits the form → `profile_submitted_at` timestamp set on the project.
- Client sees: **"Thank you! We'll review your details and share your project timeline shortly."**
- Portal then shows a **holding/blank screen** — no more Next buttons. This is the transition into Mode B.

---

### Mode B — Admin-Populated Dashboard (Steps 5–8, non-sequential)

Once Step 4 is submitted, the client's dashboard becomes a **status board**. Each section below is invisible until Admin explicitly uploads/releases it, and each appears independently in real time the moment Admin does so — no fixed order required.

**Timeline** — visible once Admin uploads the timeline document (via the existing staff-side "Documents" panel, marked client-visible). Client sees it rendered/downloadable.

**Final Invoice (remaining balance)** — the amount was already auto-calculated at Step 3's approval; it stays hidden until Admin clicks **"Release Final Invoice."** Once released, client sees the pending amount, the same QR/bank-details block, uploads a screenshot, and goes through the identical Admin-approval flow as the advance payment.

**Handles/Logins Collected** — a simple confirmation the client sees once Admin marks `handles_collected = true` on the project (e.g. "We've received your Instagram, hosting, and domain access — thank you!").

**Project Running / Tracking** — a running feed of short status updates Admin posts from the project page (e.g. "Homepage design in progress," "First draft sent for review"). Client sees these as a simple timeline on their dashboard. Only updates Admin explicitly marks client-visible appear (internal notes stay internal).

---

## 2.3 New Admin-Side Screens Required

| Screen | Purpose |
|---|---|
| **Client creation form** | Now includes `client_type` (Tech/Content/Both) and a "Generate portal login" action |
| **Agreement panel** (per project) | Upload agreement PDF, view client's agreed status + signature |
| **Payment Verification Queue** | List of pending screenshot uploads (advance + final), Approve/Reject actions |
| **Bank Settings** | One editable record: UPI ID, QR image upload, bank name, account number, IFSC, account holder — used across all clients |
| **Form Builder** | Add/edit/delete/reorder dynamic profile-handover questions, scoped to `tech` / `content` / `general` |
| **Form Responses viewer** (per project) | See what the client submitted in Step 4 |
| **Client Dashboard Controls** (per project) | Mark timeline uploaded, release final invoice, mark handles collected, post status updates — these directly control what the client sees |

---

## 2.4 What the Client Can Never See
- Other clients or their projects
- Staff assignments, internal checklist labels/notes
- Internal activity log
- Any document not explicitly marked client-visible
- Internal-only status updates

---

## 2.5 Out of Scope (still v2, but not this pass)
- Automated payment gateway (Razorpay/Stripe) — screenshot + manual approval is intentional for now, matches how WebbHeads actually collects payments
- Automated email/SMS/WhatsApp triggers — v2 uses manual "send email" buttons; automation is a later pass
- Multi-project-per-client support — deferred per your answer; schema below is built so this can be added later without a rewrite (each `project` already independently links to one `client`, and `client_users` maps to `client_id` not `project_id`, so multi-project support later just means changing the portal's query, not the schema)

---

## 2.6 Tech Notes
- File uploads (agreement PDFs, signatures, payment screenshots, QR image, form-builder file answers) go to **Supabase Storage**, with signed/public URLs stored in the relevant tables.
- All client-facing reads/writes go through **RLS policies** scoped to `client_users.client_id = clients.id` — a client can only ever touch rows tied to their own client record.
- **Supabase Realtime** on `payment_requests`, `documents`, `project_status_updates`, and the `projects` row itself, so the client's dashboard updates live the instant Admin approves a payment or uploads a document — no page refresh needed.
