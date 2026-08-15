# Detailed Developer Guide: Supabase to Neon & Cloudinary Migration

Welcome! We are migrating this Next.js app's backend away from Supabase. Supabase pauses inactive projects after 1 week, so we are replacing it with a stack that **never pauses on the free tier**:
*   **Database:** Neon (PostgreSQL)
*   **File Storage:** Cloudinary
*   **Authentication:** NextAuth.js (Auth.js)

This guide is written step-by-step so you don't miss any features (like password resets or client login generation) that Supabase used to handle automatically.

---

## 🟢 Phase 1: Database Setup (Neon)

I have already consolidated all of the old Supabase SQL migrations into a single, clean SQL script for you. It removes all Supabase-specific dependencies (like `auth.users` and RLS policies) and adds necessary columns for NextAuth (like `password_hash` and `reset_token`).

1. Open the file **`neon_schema.sql`** (located in the root of the project).
2. Copy all of the code inside it.
3. Log into your Neon.tech account, open the SQL Editor for your project, paste the code, and run it.
4. *(Optional but recommended)*: The script automatically inserts a Super Admin user with the email `admin@webbheads.com` and password `password123`.

---

## 🟢 Phase 2: Environment Variables

Ensure these variables are added to `.env.local` (and eventually to Vercel production):

```env
# Neon Database
DATABASE_URL="postgres://user:password@host.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your_long_random_string_here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your_unsigned_preset"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 🟢 Phase 3: Authentication (NextAuth.js)

Because we dropped Supabase, you must build the authentication layer from scratch.

1. **Install Dependencies:**
   Run `npm install next-auth bcryptjs` and `npm install -D @types/bcryptjs`.
2. **Create NextAuth Config:**
   Create the file `src/app/api/auth/[...nextauth]/route.ts`.
   *   Configure the `CredentialsProvider`.
   *   In the `authorize` function, connect to Neon, query the `staff` table first. If not found, query the `client_users` table.
   *   Use `bcrypt.compare()` to verify the user's input password against the `password_hash` in the database.
   *   Return the user object (include their role/type so the frontend knows if they are staff or a client).
3. **Update Middleware:**
   Rewrite `src/middleware.ts` to use `withAuth` from NextAuth to protect `/dashboard` (staff) and `/portal` (clients).
4. **Update Login Form:**
   Update `app/login/page.tsx` (or its client component) to use `signIn('credentials', { email, password })` from `next-auth/react`.

---

## 🟢 Phase 4: Data Access (Drizzle ORM)

Currently, the app uses `supabase.from('table').select('*')` everywhere. We need to replace this with Drizzle ORM.

1. **Install Dependencies:**
   Run `npm install drizzle-orm @neondatabase/serverless` and `npm install -D drizzle-kit`.
2. **Create Schema File:**
   Create `src/db/schema.ts` and define all the tables exactly as they appear in `neon_schema.sql` using Drizzle syntax.
3. **Setup DB Connection:**
   Create `src/db/index.ts` to export the initialized `drizzle()` instance connected to `process.env.DATABASE_URL`.
4. **Rewrite Queries:**
   Search the codebase for `@supabase/supabase-js` and `createClient()`. In files like `src/lib/supabase/actions.ts` and `admin-portal-actions.ts`, replace the Supabase calls with Drizzle queries.
   *   *Example:* `await supabase.from('projects').select('*')` becomes `await db.select().from(projects)`.

---

## 🟢 Phase 5: Critical Features Implementation

Supabase handled user creation and password resets under the hood. You must manually implement these features using Next.js Server Actions:

1. **Generating Logins for Clients / Inviting Staff:**
   *   When an Admin creates a new client or staff member in the dashboard, generate a random temporary password (or use a default like `welcome123`).
   *   Hash this password using `await bcrypt.hash('welcome123', 10)`.
   *   Insert the new user into the `client_users` or `staff` table with the `password_hash`.
2. **Password Resets / Changing Passwords:**
   *   The database now has `reset_token` and `reset_token_expires` columns. 
   *   When a user requests a reset, generate a random token (e.g., using `crypto.randomBytes`), save it to the DB with an expiration date (e.g., 1 hour), and send them a link containing that token.
   *   When they submit a new password, verify the token, hash the new password, update `password_hash`, and clear the token.

---

## 🟢 Phase 6: File Storage (Cloudinary)

1. **Install Dependency:**
   Run `npm install cloudinary`.
2. **Rewrite Upload Logic:**
   In `src/lib/supabase/portal-actions.ts` and `admin-portal-actions.ts`, find where files are uploaded using `adminClient.storage`.
3. **Upload to Cloudinary:**
   Convert the incoming `File` object to a base64 string or buffer, and use the Cloudinary Node SDK's `uploader.upload()` function to upload it.
4. **Save the URL:**
   Cloudinary will return a secure `secure_url`. Save this URL into the Neon database instead of the Supabase public URL.

---

## 🤖 Prompt for the Developer

Copy and paste this exact prompt to your AI assistant to kick off the work:

> "We are executing a backend migration from Supabase to Neon (PostgreSQL), Cloudinary (Storage), and NextAuth.js (Authentication). The SQL schema has already been consolidated and applied to our Neon database. 
> 
> Please open the `implementation_plan.md` file and let's start executing **Phase 3: Authentication (NextAuth.js)**. 
> 1. Help me install NextAuth and bcryptjs.
> 2. Write the `src/app/api/auth/[...nextauth]/route.ts` file that uses `pg` or Drizzle to check the `staff` and `client_users` tables in our Neon DB, and verifies the `password_hash` using bcrypt.
> 
> Let's do this step-by-step!"
