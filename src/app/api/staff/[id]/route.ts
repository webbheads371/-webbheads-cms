import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * DELETE /api/staff/[id]
 * Admin-only: permanently deletes a staff member from both the
 * staff table and Supabase Auth.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()

  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set: () => {}, remove: () => {} } }
  )

  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set: () => {}, remove: () => {} } }
  )

  // Verify caller is admin
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await adminClient
    .from("staff")
    .select("role")
    .eq("id", user.id)
    .single()

  if (caller?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can delete staff" }, { status: 403 })
  }

  // Prevent self-deletion
  if (params.id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
  }

  // Remove from staff table first
  const { error: staffErr } = await adminClient
    .from("staff")
    .delete()
    .eq("id", params.id)

  if (staffErr) return NextResponse.json({ error: staffErr.message }, { status: 500 })

  // Remove from auth
  const { error: authErr } = await adminClient.auth.admin.deleteUser(params.id)
  if (authErr) {
    // Auth deletion failed but staff row is gone — log but don't block
    console.error("Auth deletion failed for", params.id, authErr.message)
  }

  return NextResponse.json({ ok: true })
}
