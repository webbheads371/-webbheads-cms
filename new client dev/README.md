# WebbHeads Client Management System (WCMS) — Project Kit

This folder has everything you need to hand off to your AI coding tool (Antigravity, Claude Code, etc.) and start building.

## Files in this kit

| File | Purpose |
|---|---|
| `requirements.md` | Full PRD — pipeline stages, roles, features, tech stack reasoning, backend choice explained |
| `prompt.md` | **The actual build prompt** — paste this into Antigravity/your AI IDE to generate the app |
| `supabase_migration.sql` | Ready-to-run SQL: schema, seed data (stages + checklists), RLS policies |

## How to use this

1. **Create the Supabase project** first (name it something like `webbheads-cms`, separate from your real-estate CRM project — keep them isolated).
2. In the Supabase SQL editor, run `supabase_migration.sql` first (Phase 1 — staff portal: clients, projects, pipeline stages, checklists, payments, documents).
3. Then run `supabase_migration_0002_client_portal.sql` (Phase 2 — client portal: client logins, agreements, bank settings, payment requests, dynamic forms, status updates). This one depends on Phase 1 already existing, so order matters.
4. Grab your project URL + anon key + service role key from Supabase project settings → API.
5. Scaffold a new Next.js 14 project (`npx create-next-app@latest webbheads-cms --typescript --tailwind --app`), add shadcn/ui (`npx shadcn@latest init`).
6. Open the project in Antigravity (or your AI IDE) and paste `prompt.md` (Phase 1 build) as your first message if you haven't built the staff portal yet. Once that's working, paste the Phase 2 continuation prompt to add the client portal on top.
7. Add your Supabase keys to `.env.local`.
8. First real account: manually insert your own row into `auth.users` via Supabase Auth UI (invite yourself), then insert a matching row into `staff` with `role = 'admin'`. After that, use the in-app Staff page to invite your Tech Lead and Content Lead, and the Client page to generate client portal logins.

## Why Supabase (short version)

You're already running Supabase across the real-estate CRM, LeadCore, GITAM journal system, and Lifecore OS — same stack means you reuse your auth/RLS patterns instead of relearning a new backend. It's also genuinely the right technical fit here: this data is relational (clients → projects → stages → checklist items → payments), and Supabase's Row-Level Security lets you enforce "Tech Lead only sees their assigned projects" at the database level, not just hidden in frontend code. Full comparison against Firebase/PocketBase/custom Node is in `requirements.md` §8.

## Suggested repo name
`webbheads-cms` (or `webbheads-client-portal`) — keep it separate from your real-estate CRM repo since this is an internal ops tool, not a client-billable product.
