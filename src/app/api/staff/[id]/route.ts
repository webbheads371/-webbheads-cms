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

  // Nullify foreign key references in projects table
  await adminClient.from("projects").update({ tech_lead_id: null }).eq("tech_lead_id", params.id)
  await adminClient.from("projects").update({ content_lead_id: null }).eq("content_lead_id", params.id)

  // Nullify foreign key references in other tables
  await adminClient.from("clients").update({ created_by: null }).eq("created_by", params.id)
  await adminClient.from("client_users").update({ created_by: null }).eq("created_by", params.id)
  await adminClient.from("form_templates").update({ created_by: null }).eq("created_by", params.id)
  await adminClient.from("project_status_updates").update({ posted_by: null }).eq("posted_by", params.id)
  await adminClient.from("activity_log").update({ actor_id: null }).eq("actor_id", params.id)
  await adminClient.from("documents").update({ uploaded_by: null }).eq("uploaded_by", params.id)
  await adminClient.from("payment_requests").update({ verified_by: null }).eq("verified_by", params.id)
  await adminClient.from("payment_requests").update({ released_by: null }).eq("released_by", params.id)
  await adminClient.from("agreements").update({ uploaded_by: null }).eq("uploaded_by", params.id)
  await adminClient.from("bank_settings").update({ updated_by: null }).eq("updated_by", params.id)
  await adminClient.from("payments").update({ recorded_by: null }).eq("recorded_by", params.id)
  await adminClient.from("project_checklist_items").update({ done_by: null }).eq("done_by", params.id)

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
