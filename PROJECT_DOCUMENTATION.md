# WebbHeads Client Management System (WCMS) — Comprehensive Project Documentation & Technical Specification

> **Notice**: Internal Architectural & Technical Reference Document. Do not distribute externally.

---

## 1. Executive Summary & Core Concept

The **WebbHeads Client Management System (WCMS)** is an end-to-end, dual-portal agency operations platform engineered to manage the entire agency lifecycle from initial client discovery and quotation to digital contracting, automated onboarding, production milestone tracking, financial receipts verification, and project close-out.

The system resolves the traditional disconnect between internal team execution and external client transparency through a **two-sided architecture**:
1. **Internal Staff Portal (`/dashboard`, `/pipeline`, `/projects`, `/staff`, `/settings`, `/payments/queue`)**:
   - Designed for internal WebbHeads operations: **Admin (CXO)**, **Tech Leads**, **Content Leads**, and **Sales Leads**.
   - Implements a fixed **8-stage Kanban delivery pipeline** with soft gating based on per-stage checklist completion.
   - Manages client deliverables, digital agreements, payment verifications, dynamic form responses, document repositories, and staff role assignments.
2. **External Client Portal (`/portal`)**:
   - Designed for clients with a strictly scoped, self-serve interface.
   - Features **two operating modes**:
     - **Mode A (Sequential Onboarding Wizard)**: A 5-step, gated onboarding flow (Welcome $\rightarrow$ Deliverables Review $\rightarrow$ Digital Agreement & Signature $\rightarrow$ Advance Payment $\rightarrow$ Profile Handover Form).
     - **Mode B (Admin-Populated Live Status Dashboard)**: An interactive, glassmorphic dashboard revealing sections (Home, Credentials, Documents, Payments with Final Invoice, Support Chat, Content/Tech Schedule) dynamically as staff release them.

---

## 2. Technology Stack & Dependencies

### Core Framework & Runtime
- **Next.js 14 (`14.1.0`)**: App Router architecture utilizing React Server Components (RSC), Client Components (`"use client"`), and React Server Actions (`"use server"`).
- **React 18 (`18.2.0`) & React DOM (`18.2.0`)**: UI rendering engine with transitions (`useTransition`), optimistic updates, and suspense boundaries.
- **TypeScript (`5.3.3`)**: Strict mode type checking across data access, API contracts, session interfaces, and component properties.
- **Node.js Environment**: Target runtime with modern ESM and Node compatibility.

### Database & Data Access Layer
- **Neon Serverless PostgreSQL**: Cloud-native Postgres instance utilizing `@neondatabase/serverless` (`^1.1.0`) with SSL connection pooling (`pg` `^8.22.0`).
- **Drizzle ORM (`0.45.2`)**: Type-safe schema definitions, relationships, and queries.
- **Drizzle Kit (`0.31.10`)**: Database migration generator and schema management tooling.

### Authentication & Authorization
- **NextAuth.js (`4.24.15`)**: Session management using JSON Web Tokens (JWT).
- **Credentials Provider**: Authenticates both `staff` and `client_users` from the database in a unified entry point.
- **bcryptjs (`3.0.3`)**: Blowfish-based password hashing (salt rounds: 10) for stored credentials.

### Storage & Media Hosting
- **Cloudinary (`2.10.0`)**: Cloud-based media storage for agreement PDFs, digital signature PNGs, payment screenshots (UPI receipts), company bank QR codes, and client asset uploads. Configured with secure delivery URLs.

### Styling & UI Primitives
- **Tailwind CSS (`3.4.1`)**: Utility-first CSS engine with dark mode (`class`), responsive breakpoints, and custom CSS variables.
- **Radix UI Primitives**: Accessible, unstyled UI components including Dialog, Dropdown Menu, Tabs, Popover, Select, Progress, Checkbox, Avatar, Separator, and Toast.
- **class-variance-authority (`0.7.0`)**, **clsx (`2.1.0`)**, and **tailwind-merge (`2.2.0`)**: Reusable component variant generation and conflict-free class merging.
- **tailwindcss-animate (`1.0.7`)**: CSS keyframe animations (fade-in, accordion, spin-slow, shake).
- **Lucide React (`0.303.0`)**: Iconography library.
- **Liquid Chrome / Glassmorphic Custom Theme**: Tailored glassmorphism styles with backdrop blur, saturated translucent backgrounds, and border highlights.

### Interaction & Additional Libraries
- **@dnd-kit (`core ^6.1.0`, `sortable ^8.0.0`, `utilities ^3.2.2`)**: Modern drag-and-drop toolkit powering the Pipeline Kanban board.
- **@google/generative-ai (`0.24.1`)**: Google Gemini AI integration for intelligent escalation tracking in the client support chat.
- **next-themes (`0.2.1`)**: Light/Dark theme switching support.

---

## 3. High-Level Architecture & Request Flow

```
                      ┌───────────────────────────────────────────────┐
                      │              Client Web Browsers              │
                      │   - Staff UI: /dashboard, /pipeline, etc.     │
                      │   - Client UI: /portal/onboarding, /portal    │
                      └───────────────────────┬───────────────────────┘
                                              │ HTTP / HTTPS
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │              Edge Middleware Layer            │
                      │              (src/middleware.ts)              │
                      │   - Verifies NextAuth JWT Token               │
                      │   - RBAC: Client vs Staff Route Isolation     │
                      │   - Public vs Protected Route Filtering       │
                      └───────────────────────┬───────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│     Next.js Server Actions Layer      │   │       Next.js REST API Handlers       │
│         ("use server")                │   │         (/src/app/api/*)              │
│ - actions.ts (core project ops)       │   │ - /api/auth/[...nextauth]             │
│ - portal-actions.ts (client wizard)   │   │ - /api/clients/[id] (cascade delete)  │
│ - admin-portal-actions.ts (controls)  │   │ - /api/staff/[id] (safe delete)       │
│ - message-actions.ts (chat & support) │   │ - /api/staff/invite (provisioning)    │
│ - password-reset-actions.ts           │   │                                       │
└───────────────────┬───────────────────┘   └───────────────────┬───────────────────┘
                    │                                           │
                    └─────────────────────────┬─────────────────┘
                                              │
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │            Data & Storage Services            │
                      │  ┌───────────────────┐ ┌───────────────────┐  │
                      │  │    Drizzle ORM    │ │ Cloudinary Client │  │
                      │  │  (src/db/index.ts)│ │(src/lib/cloudinary)│ │
                      │  └─────────┬─────────┘ └─────────┬─────────┘  │
                      └────────────┼─────────────────────┼────────────┘
                                   │                     │
                                   ▼                     ▼
                      ┌──────────────────────┐ ┌──────────────────────┐
                      │   Neon PostgreSQL    │ │    Cloudinary CDN    │
                      │  Serverless Database │ │ (PDFs, Images, Proof)│
                      └──────────────────────┘ └──────────────────────┘
```

---

## 4. Complete Database Schema (18 Tables)

Defined in [`src/db/schema.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/db/schema.ts):

### 1. `staff`
Stores internal team members with role-based access.
- `id` (UUID, PK, default random)
- `full_name` (Text, NOT NULL)
- `email` (Text, NOT NULL, UNIQUE)
- `password_hash` (Text, NOT NULL)
- `reset_token` (Text, nullable)
- `reset_token_expires` (Timestamp with timezone, nullable)
- `role` (Text, NOT NULL) — values: `admin`, `tech_lead`, `content_lead`, `sales`
- `created_at` (Timestamp with timezone, default now)

### 2. `clients`
Base organization/company profiles serviced by WebbHeads.
- `id` (UUID, PK, default random)
- `company_name` (Text, NOT NULL)
- `contact_name` (Text, nullable)
- `phone` (Text, nullable)
- `email` (Text, nullable)
- `source` (Text, nullable)
- `client_type` (Text, default `'both'`, NOT NULL) — values: `tech`, `content`, `both`
- `created_at` (Timestamp with timezone, default now)
- `created_by` (UUID, FK $\rightarrow$ `staff.id`)

### 3. `client_users`
Login accounts for external client users.
- `id` (UUID, PK, default random)
- `client_id` (UUID, FK $\rightarrow$ `clients.id` ON DELETE CASCADE, NOT NULL)
- `full_name` (Text, NOT NULL)
- `email` (Text, NOT NULL, UNIQUE)
- `password_hash` (Text, NOT NULL)
- `reset_token` (Text, nullable)
- `reset_token_expires` (Timestamp with timezone, nullable)
- `created_at` (Timestamp with timezone, default now)
- `created_by` (UUID, FK $\rightarrow$ `staff.id`)

### 4. `pipeline_stages`
Fixed reference table for pipeline stages.
- `key` (Text, PK) — e.g. `quotation`, `welcome`, `agreement`, `profile_handover`, `timeline`, `script_tech_flow`, `goal_measurement`, `onboarding`, `closed_lost`
- `label` (Text, NOT NULL)
- `sort_order` (Integer, NOT NULL)

### 5. `projects`
The primary operational deal entity linking client, pipeline, leads, and financials.
- `id` (UUID, PK, default random)
- `client_id` (UUID, FK $\rightarrow$ `clients.id` ON DELETE CASCADE)
- `name` (Text, NOT NULL)
- `current_stage` (Text, FK $\rightarrow$ `pipeline_stages.key`, default `'quotation'`, NOT NULL)
- `status` (Text, default `'active'`, NOT NULL) — values: `active`, `closed_won`, `closed_lost`
- `tech_lead_id` (UUID, FK $\rightarrow$ `staff.id`)
- `content_lead_id` (UUID, FK $\rightarrow$ `staff.id`)
- `sales_lead_id` (UUID, FK $\rightarrow$ `staff.id` ON DELETE SET NULL)
- `project_value` (Numeric, nullable)
- `advance_percent` (Numeric, default `'50'`)
- `expected_close_date` (Date, nullable)
- `expected_start_date` (Date, nullable)
- `timeline_design_status` (Text, nullable) — `'completed'`, `'in_progress'`, `'upcoming'`
- `timeline_dev_status` (Text, nullable)
- `timeline_review_status` (Text, nullable)
- `timeline_design_name` (Text, default `'Design Phase'`)
- `timeline_dev_name` (Text, default `'Development'`)
- `timeline_review_name` (Text, default `'Review'`)
- `welcome_seen_at` (Timestamp with timezone, nullable)
- `profile_submitted_at` (Timestamp with timezone, nullable)
- `handles_collected` (Boolean, default `false`)
- `handles_collected_at` (Timestamp with timezone, nullable)
- `deliverables_content` (Text, nullable)
- `deliverables_pdf_url` (Text, nullable)
- `deliverables_approved` (Boolean, default `false`)
- `deliverables_approved_at` (Timestamp with timezone, nullable)
- `ai_escalated` (Boolean, default `false`)
- `created_at` (Timestamp with timezone, default now)

### 6. `checklist_templates`
Preconfigured standard checklist items per pipeline stage.
- `id` (UUID, PK, default random)
- `stage_key` (Text, FK $\rightarrow$ `pipeline_stages.key`, NOT NULL)
- `label` (Text, NOT NULL)
- `category` (Text, NOT NULL) — values: `tech`, `content`, `sales`, `general`
- `is_required` (Boolean, default `true`)
- `sort_order` (Integer, NOT NULL)

### 7. `project_checklist_items`
Instantiated checklist items specific to an active project.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE)
- `template_id` (UUID, FK $\rightarrow$ `checklist_templates.id`, nullable)
- `stage_key` (Text, FK $\rightarrow$ `pipeline_stages.key`, NOT NULL)
- `label` (Text, NOT NULL)
- `category` (Text, NOT NULL)
- `is_required` (Boolean, NOT NULL)
- `is_done` (Boolean, default `false`)
- `done_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `done_at` (Timestamp with timezone, nullable)
- `notes` (Text, nullable)

### 8. `payments`
Internal financial ledger entries logged by staff.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE)
- `amount` (Numeric, NOT NULL)
- `payment_type` (Text, nullable) — `'advance'`, `'partial'`, `'final'`
- `method` (Text, nullable) — `'upi'`, `'bank_transfer'`, `'cheque'`, `'cash'`
- `paid_on` (Date, NOT NULL)
- `note` (Text, nullable)
- `recorded_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `created_at` (Timestamp with timezone, default now)

### 9. `documents`
Repository of files, diagrams, specifications, and links.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE)
- `doc_type` (Text, NOT NULL) — e.g. `'agreement'`, `'timeline'`, `'script'`, `'tech_flow'`, `'poc_email'`
- `title` (Text, NOT NULL)
- `url` (Text, nullable)
- `uploaded_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `uploaded_at` (Timestamp with timezone, default now)
- `is_client_visible` (Boolean, default `false`)

### 10. `activity_log`
Comprehensive audit trail recording actions across projects.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE)
- `actor_id` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `action` (Text, NOT NULL) — e.g. `'stage_changed'`, `'checklist_toggled'`, `'payment_added'`
- `detail` (JSONB, nullable)
- `created_at` (Timestamp with timezone, default now)

### 11. `messages`
Support and operational messaging between staff and clients.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE, NOT NULL)
- `sender_id` (UUID, NOT NULL)
- `sender_role` (Text, NOT NULL) — `'client'`, `'admin'`, `'tech_lead'`, `'content_lead'`, `'sales'`
- `recipient_role` (Text, NOT NULL)
- `recipient_id` (UUID, nullable)
- `message` (Text, NOT NULL)
- `is_read` (Boolean, default `false`)
- `created_at` (Timestamp with timezone, default now, NOT NULL)

### 12. `content_schedule`
Publishing calendar and milestone deliverable dates.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE, NOT NULL)
- `content_name` (Text, NOT NULL)
- `caption` (Text, nullable)
- `scheduled_at` (Timestamp with timezone, NOT NULL)
- `is_posted` (Boolean, default `false`)
- `posted_at` (Timestamp with timezone, nullable)
- `created_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `created_at` (Timestamp with timezone, default now)
- `updated_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `updated_at` (Timestamp with timezone, default now)

### 13. `agreements`
Digital legal contracts per project.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE, NOT NULL, UNIQUE)
- `agreement_type` (Text, default `'pdf'`, NOT NULL)
- `content_text` (Text, nullable)
- `pdf_url` (Text, nullable)
- `uploaded_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `uploaded_at` (Timestamp with timezone, default now)
- `client_agreed` (Boolean, default `false`)
- `agreed_at` (Timestamp with timezone, nullable)
- `signature_url` (Text, nullable)
- `signature_uploaded_at` (Timestamp with timezone, nullable)
- `confirmation_email_sent` (Boolean, default `false`)
- `confirmation_email_sent_at` (Timestamp with timezone, nullable)

### 14. `bank_settings`
Global company banking and UPI information for client payments.
- `id` (Integer, default 1, PK)
- `upi_id` (Text, nullable)
- `qr_image_url` (Text, nullable)
- `bank_name` (Text, nullable)
- `account_holder` (Text, nullable)
- `account_number` (Text, nullable)
- `ifsc` (Text, nullable)
- `updated_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `updated_at` (Timestamp with timezone, default now)

### 15. `payment_requests`
Invoices presented to clients with verification workflow.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE, NOT NULL)
- `request_type` (Text, NOT NULL) — `'advance'`, `'final'`
- `amount` (Numeric, NOT NULL)
- `status` (Text, default `'pending_payment'`, NOT NULL) — `'pending_payment'`, `'submitted'`, `'approved'`, `'rejected'`
- `screenshot_url` (Text, nullable)
- `submitted_at` (Timestamp with timezone, nullable)
- `verified_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `verified_at` (Timestamp with timezone, nullable)
- `rejection_reason` (Text, nullable)
- `released` (Boolean, default `false`)
- `released_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `released_at` (Timestamp with timezone, nullable)
- `created_at` (Timestamp with timezone, default now)

### 16. `form_templates`
Admin dynamic questionnaire schema for onboarding handover.
- `id` (UUID, PK, default random)
- `scope` (Text, NOT NULL) — `'general'`, `'tech'`, `'content'`
- `label` (Text, NOT NULL)
- `field_type` (Text, NOT NULL) — `'text'`, `'textarea'`, `'file'`, `'url'`, `'checkbox'`
- `is_required` (Boolean, default `true`)
- `sort_order` (Integer, default 0, NOT NULL)
- `created_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `created_at` (Timestamp with timezone, default now)

### 17. `form_responses`
Client answers to dynamic onboarding questions.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE, NOT NULL)
- `template_id` (UUID, FK $\rightarrow$ `form_templates.id`, NOT NULL)
- `value` (Text, nullable)
- `submitted_at` (Timestamp with timezone, default now)

### 18. `project_status_updates`
Feed of micro-updates and announcements posted by staff.
- `id` (UUID, PK, default random)
- `project_id` (UUID, FK $\rightarrow$ `projects.id` ON DELETE CASCADE, NOT NULL)
- `message` (Text, NOT NULL)
- `posted_by` (UUID, FK $\rightarrow$ `staff.id`, nullable)
- `posted_at` (Timestamp with timezone, default now)
- `visible_to_client` (Boolean, default `true`)

---

## 5. Authentication, Roles & Security Model

### Authentication Engine ([`src/lib/auth.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/lib/auth.ts))
NextAuth is configured using JWT strategy. Both internal staff and external clients authenticate through the single login screen at `/login`:
1. The credentials provider normalizes the input email.
2. Checks the `staff` table first. If found, validates the password hash via `bcrypt.compare`. On success, returns session with `userType: "staff"` and `role: staff.role`.
3. If not in `staff`, checks `client_users`. If found and password matches, returns session with `userType: "client"`, `role: "client"`, and `clientId: client_user.client_id`.
4. Token and session callbacks append `id`, `role`, `userType`, and `clientId` to the NextAuth session.

### Middleware Route Protection ([`src/middleware.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/middleware.ts))
- **Public Routes**: `/login`, `/forgot-password`, `/reset-password`, static assets, and `/api/auth/*`.
- **Logged Out Protection**: Any unauthenticated access to protected routes redirects to `/login?callbackUrl=...`.
- **Logged In Redirection**: Logged in users visiting public auth pages are directed to `/dashboard` (staff) or `/portal` (clients).
- **Staff vs Client Isolation**:
  - `userType === "client"` attempting to access staff routes (`/dashboard`, `/pipeline`, `/clients`, `/staff`, `/projects`, `/payments`, `/settings`) is immediately redirected to `/portal`.
  - `userType === "staff"` attempting to access `/portal` is redirected to `/dashboard`.

### Role-Based Access Control Matrix

| Role | Scope & Permissions |
|---|---|
| **Admin** | Full system access. Create/edit/delete clients, projects, staff, checklists, bank settings, dynamic form templates; verify payments; release final invoices; view all financial metrics. |
| **Tech Lead** | Access to assigned projects. Toggles tech-category checklists; uploads tech specs/flows; views client credentials; messages clients via Tech channel. |
| **Content Lead** | Access to assigned projects. Toggles content checklists; manages content calendar; uploads scripts; reviews brand assets; messages clients via Content channel. |
| **Sales** | Manages stage 0 $\rightarrow$ stage 2; tracks proposals, agreements, and advance invoice generation; messages clients via Sales channel. |
| **Client** | Strictly scoped to their own company's project. Completes sequential onboarding wizard; views approved deliverables, agreements, receipts, shared documents, and live status updates; communicates via support chat. |

---

## 6. Functional Breakdown: Staff Portal

### 6.1 Dashboard (`/dashboard`)
- **Metrics Overview**: Total active projects, stage distribution funnel, total invoiced value, total collected payments, outstanding/pending balance.
- **Projects Summary**: Recent project cards displaying client name, stage badges, assigned leads, and expected start/close dates.

### 6.2 Pipeline Kanban Board (`/pipeline`)
- **8 Core Columns**: Quotation $\rightarrow$ Welcome $\rightarrow$ Agreement $\rightarrow$ Profile Handover $\rightarrow$ Timeline $\rightarrow$ Script/Tech Flow $\rightarrow$ Goal Measurement $\rightarrow$ Onboarding (+ `closed_lost`).
- **Drag-and-Drop (@dnd-kit)**: Interactive movement between stages.
- **Soft Gating Engine**: Enforces that required checklist items in the current stage are satisfied before moving forward (admins retain override permission).
- **Filtering**: Real-time filtering by assigned staff lead, deal status, and search terms.

### 6.3 Client Management (`/clients` & `/clients/[id]`)
- **Create Client Modal**: Record company name, contact person, phone, email, source, and `client_type` (`tech`, `content`, `both`).
- **Client Detail View**: Full overview of company projects, associated portal user logins, and client metadata.
- **Delete Client**: Accessible to Admin and Tech Lead with comprehensive cascading cleanup across all 18 linked tables.

### 6.4 Project Detail Workspace (`/projects/[id]`)
The core project management center featuring 11 specialized tabs:
1. **Checklist Tab**: Stage-categorized checklists (`tech`, `content`, `sales`, `general`). Toggling items records the actor (`done_by`) and timestamp (`done_at`).
2. **Deliverables Tab**: Edit project deliverables scope, upload deliverables PDF, and track client approval status.
3. **Agreement Tab**: Upload agreement PDF or draft Markdown text; review client agreement status, agreement timestamp, and uploaded digital signature image.
4. **Payments & Requests Tab**: Manage advance (50%) and final balance payment requests; inspect client payment receipts; manually record off-platform payments.
5. **Work Updates Tab**: Broadcast short status notes and progress updates with client visibility toggle.
6. **Documents Tab**: Upload project artifacts (timelines, scripts, technical flow diagrams, NDAs) with an `is_client_visible` toggle.
7. **Activity Timeline Tab**: Full chronological audit trail of all stage transitions, checklist checks, uploads, and edits.
8. **Content/Tech Schedule Tab**: Interactive calendar or list of scheduled posts, deliverables, or technical sprint milestones.
9. **Client Form Tab**: Review answers submitted by the client during the Phase 4 onboarding questionnaire.
10. **Client Portal Link Tab**: Generate/reset client credentials, copy direct portal links, view onboarding step completion status.
11. **Edit Details Tab (Admin only)**: Edit deal valuation, advance percentage, lead assignments, and dates.

### 6.5 Payment Verification Queue (`/payments/queue`)
- Lists all pending payment screenshot proofs submitted by clients for advance or final balances.
- Displays project name, client contact, amount, and preview screenshot.
- **Approve Action**: Sets request to `approved`, auto-creates a corresponding `payments` record, and unlocks the client's next step.
- **Reject Action**: Requires a rejection reason, updates status to `rejected`, and prompts client to re-upload.

### 6.6 Staff Administration (`/staff`)
- Admin invites staff with assigned role (`tech_lead`, `content_lead`, `sales`, `admin`).
- Optionally auto-assigns the new staff member to existing projects during creation.
- Safe deletion logic that unlinks and nullifies lead references across projects without crashing active records.

### 6.7 Settings Management (`/settings`)
- **Checklist Templates (`/settings`)**: Add, delete, and organize default checklist items for each pipeline stage.
- **Bank Settings (`/settings/bank`)**: Configure agency UPI ID, bank name, account holder, account number, IFSC code, and upload payment QR image.
- **Dynamic Form Builder (`/settings/forms`)**: Create custom questions for client onboarding. Configure label, scope (`general`, `tech`, `content`), field type (`text`, `textarea`, `file`, `url`, `checkbox`), sort order, and requirement status.

---

## 7. Functional Breakdown: Client Portal (`/portal`)

### Mode A: Sequential Onboarding Wizard (`/portal/onboarding`)
Clients must complete 5 sequential steps before entering the dashboard:
1. **Step 1 — Welcome**: Personalized welcome screen displaying client name and onboarding blurb. Clicking "Next" marks `welcome_seen_at`.
2. **Step 2 — Deliverables**: Review project deliverables scope and PDF. Client clicks "Approve Deliverables" to mark `deliverables_approved = true`.
3. **Step 3 — Agreement & Digital Signature**: Inline PDF viewer for the project agreement. Client checks "I agree to the agreement" and uploads a digital signature image file.
4. **Step 4 — Advance Payment (50%)**: Displays auto-calculated advance amount, agency UPI QR code, and bank details. Client uploads payment screenshot proof. Status becomes `submitted` and waits for admin verification in the payment queue.
5. **Step 5 — Profile Handover**: Dynamic form tailored to client type (`tech`, `content`, or `both`). On submission, marks `profile_submitted_at` and unlocks Mode B.

### Mode B: Dynamic Client Dashboard (`/portal/dashboard`)
Liquid Chrome / Glassmorphic UI with dynamic tabs:
- **Home Tab**: Personalized greeting, active stage status stepper (Design, Development, Review), and running work updates feed.
- **Credentials Tab**: Displays submitted credentials, hosting/domain logins, and handles collected status badge.
- **Documents Tab**: Download timeline documents, scripts, tech flows, and contracts marked `is_client_visible = true`.
- **Payments Tab**: View advance receipt and final invoice. When Admin clicks "Release Final Invoice", client sees pending balance and uploads final payment proof.
- **Support Chat Tab**: Direct multi-channel messaging with Admin, Tech Lead, Content Lead, and Sales Lead.
- **Schedule Tab**: Real-time content publishing schedule or development milestone tracker.

---

## 8. Complete API & Server Actions Inventory

### 8.1 REST API Routes

| HTTP Method | Route | Description | Access / RBAC |
|---|---|---|---|
| `POST` | `/api/auth/[...nextauth]` | NextAuth authentication handlers | Public |
| `DELETE` | `/api/clients/[id]` | Cascade delete client and all linked project data | Admin, Tech Lead |
| `DELETE` | `/api/staff/[id]` | Delete staff member with safe lead unlinking | Admin only |
| `POST` | `/api/staff/invite` | Create staff user, hash password, assign projects | Admin only |

### 8.2 Server Actions (`"use server"`)

#### Core Actions ([`src/lib/actions/actions.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/lib/actions/actions.ts))
- `login(formData)`: Handle login credential verification.
- `logout()`: Invalidate active session.
- `createClientAction(formData)`: Create company and primary contact.
- `createProjectAction(formData)`: Provision project deal and instantiate checklist items.
- `moveProjectStage(projectId, newStage)`: Transition stage, check gating, record audit log.
- `toggleChecklistItem(itemId, isDone)`: Check/uncheck item, record actor and timestamp.
- `addPaymentAction(formData)`: Manually record payment receipt.
- `addDocumentAction(formData)`: Create document metadata and link.
- `updateProjectDetailsAction(projectId, clientId, formData)`: Edit project budget, advance %, leads, and dates.

#### Client Portal Actions ([`src/lib/actions/portal-actions.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/lib/actions/portal-actions.ts))
- `markWelcomeSeen(projectId)`: Complete Step 1 of onboarding.
- `approveDeliverables(projectId)`: Client approval of project deliverables.
- `updateClientPassword(newPassword)`: Self-serve client password update.
- `agreeToAgreement(projectId)`: Record agreement acceptance.
- `uploadSignature(projectId, formData)`: Upload signature image to Cloudinary and link to agreement.
- `uploadPaymentScreenshot(projectId, paymentRequestId, formData)`: Upload payment receipt proof to Cloudinary.
- `submitProfileForm(projectId, responses)`: Save dynamic form answers and transition to Mode B.
- `uploadFormFile(file)`: Upload file answers to Cloudinary.

#### Admin Control Actions ([`src/lib/actions/admin-portal-actions.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/lib/actions/admin-portal-actions.ts))
- `generateClientPortalLogin(clientId, fullName, email, password)`: Provision client login.
- `resetClientPortalPassword(userId)`: Admin reset client password.
- `resetStaffPassword(staffId)`: Admin reset staff password.
- `uploadAgreementPdf(projectId, formData)`: Upload agreement PDF to Cloudinary.
- `saveAgreementText(projectId, contentText)`: Save Markdown contract text.
- `saveProjectDeliverables(projectId, formData)`: Save deliverables text and PDF.
- `approvePaymentRequest(paymentRequestId, projectId)`: Verify payment proof and sync to ledger.
- `rejectPaymentRequest(paymentRequestId, projectId, reason)`: Reject payment proof with reason.
- `releaseFinalInvoice(projectId)`: Make final invoice visible on client dashboard.
- `markHandlesCollected(projectId)`: Toggle handles collected confirmation badge.
- `postStatusUpdate(projectId, message, visibleToClient)`: Publish progress announcement.
- `saveBankSettings(formData)`: Update agency UPI ID, bank details, and QR image.
- `createFormTemplate / updateFormTemplate / deleteFormTemplate`: Dynamic questionnaire management.
- `saveProjectPocSettings(...)`: Configure dedicated Points of Contact.
- `saveProjectTimelineStages(...)`: Customize project phase names and statuses.
- `createContentScheduleItem / update / delete / toggle`: Manage scheduled publishing calendar.

#### Messaging Actions ([`src/lib/actions/message-actions.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/lib/actions/message-actions.ts))
- `getProjectMessages(projectId)`: Retrieve all conversation messages with sender metadata.
- `sendMessage({ projectId, messageText, recipientRole, recipientId })`: Send channel message.
- `getStaffConversations()`: Aggregate active project chats, previews, and unread counts for staff.
- `getUnreadMessagesCount()`: Total unread messages for logged-in user.
- `markMessagesAsRead(projectId, recipientRole)`: Mark messages in active channel as read.
- `setAiEscalation(projectId, escalated)`: Flag conversation for immediate human/admin intervention.

#### Password Recovery Actions ([`src/lib/actions/password-reset-actions.ts`](file:///home/vivek/WEBBHEADSS/company%20projects/webbheadscms%20updated/-webbheads-cms/src/lib/actions/password-reset-actions.ts))
- `requestPasswordReset(email)`: Generate secure crypto reset token with 1-hour expiry.
- `resetPasswordWithToken(token, newPassword)`: Validate token and update bcrypt password hash.

---

## 9. Environment Configuration

Defined in `.env.local`:

```env
# Neon Serverless PostgreSQL Connection String
DATABASE_URL=postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Canonical Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudinary Storage Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## 10. Hosting & Production Deployment

- **Application Compute**: Node.js runtime on **Vercel** or containerized via Docker on AWS ECS, Render, Railway, or DigitalOcean.
- **Database**: **Neon Serverless PostgreSQL** handling auto-scaling, SSL connection pooling, and automated backups.
- **File & Media Storage**: **Cloudinary** providing global CDN delivery and optimization for images and PDFs.
- **Build Command**: `npm run build` (`next build`).
- **Start Command**: `npm run start` (`next start`).
