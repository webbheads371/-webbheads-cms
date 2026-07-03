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
2. In the Supabase SQL editor, run `supabase_migration.sql` as-is. This creates all tables, seeds the 10 pipeline stages and ~23 checklist items, and sets up role-based RLS.
3. Grab your project URL + anon key + service role key from Supabase project settings → API.
4. Scaffold a new Next.js 14 project (`npx create-next-app@latest webbheads-cms --typescript --tailwind --app`), add shadcn/ui (`npx shadcn@latest init`).
5. Open the new project in Antigravity (or your AI IDE of choice) and paste the entire contents of `prompt.md` as your first message. It already references the schema above, so the AI will scaffold pages/components against it directly.
6. Add your Supabase keys to `.env.local`.
7. First real account: manually insert your own row into `auth.users` via Supabase Auth UI (invite yourself), then insert a matching row into `staff` with `role = 'admin'`. After that, use the in-app Staff page to invite your Tech Lead and Content Lead.

## Why Supabase (short version)

You're already running Supabase across the real-estate CRM, LeadCore, GITAM journal system, and Lifecore OS — same stack means you reuse your auth/RLS patterns instead of relearning a new backend. It's also genuinely the right technical fit here: this data is relational (clients → projects → stages → checklist items → payments), and Supabase's Row-Level Security lets you enforce "Tech Lead only sees their assigned projects" at the database level, not just hidden in frontend code. Full comparison against Firebase/PocketBase/custom Node is in `requirements.md` §8.

## Suggested repo name
`webbheads-cms` (or `webbheads-client-portal`) — keep it separate from your real-estate CRM repo since this is an internal ops tool, not a client-billable product.
