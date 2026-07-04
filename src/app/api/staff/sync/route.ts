import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * POST /api/staff/sync
 * 
 * Admin-only endpoint. Scans all Supabase auth users and creates
 * a `staff` row for any auth user that doesn't have one, using their
 * email from auth and a default role of "sales".
 * 
 * This fixes the "blank data" issue where an auth account exists
 * but no corresponding staff record was created.
 */
export async function POST() {
  const cookieStore = cookies()

  // Authenticated (anon-key) client to check who's calling
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  // Service-role client for admin operations
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  // Verify the caller is an admin staff member
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: callerStaff } = await adminClient
    .from("staff")
    .select("role")
    .eq("id", user.id)
    .single()

  if (callerStaff?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can sync staff records" }, { status: 403 })
  }

  // Get all auth users
  const { data: { users: authUsers }, error: authErr } = await adminClient.auth.admin.listUsers()
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  // Get all existing staff ids
  const { data: existingStaff } = await adminClient.from("staff").select("id, email")
  const existingStaffIds = new Set((existingStaff ?? []).map((s) => s.id))
  const existingStaffEmails = new Set((existingStaff ?? []).map((s) => s.email))

  // Find auth users not yet in the staff table
  const orphaned = authUsers.filter(
    (u) => !existingStaffIds.has(u.id) && !existingStaffEmails.has(u.email ?? "")
  )

  if (orphaned.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, message: "All auth users already have staff records." })
  }

  // Create default staff rows for orphaned auth users
  const newRows = orphaned.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Unknown",
    role: "sales", // Default role — admin can change it afterwards
  }))

  const { error: insertErr } = await adminClient.from("staff").insert(newRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    synced: newRows.length,
    users: newRows.map((r) => ({ email: r.email, role: r.role })),
    message: `Synced ${newRows.length} missing staff record(s). Default role set to 'sales' — update roles as needed.`,
  })
}
