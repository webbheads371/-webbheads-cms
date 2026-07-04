import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * DELETE /api/clients/[id]
 * Admin-only: deletes a client and cascades to their
 * portal login (client_users) and projects.
 * Projects and their associated data are cascade-deleted via FK rules.
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
    return NextResponse.json({ error: "Only admins can delete clients" }, { status: 403 })
  }

  // Delete any portal login auth accounts for this client
  const { data: clientUsers } = await adminClient
    .from("client_users")
    .select("id")
    .eq("client_id", params.id)

  if (clientUsers && clientUsers.length > 0) {
    for (const cu of clientUsers) {
      await adminClient.auth.admin.deleteUser(cu.id)
    }
  }

  // 1. Get all projects for this client
  const { data: projects } = await adminClient
    .from("projects")
    .select("id")
    .eq("client_id", params.id)

  const projectIds = projects?.map((p) => p.id) || []

  // 2. Delete all project-related data if there are projects
  if (projectIds.length > 0) {
    await adminClient.from("documents").delete().in("project_id", projectIds)
    await adminClient.from("agreements").delete().in("project_id", projectIds)
    await adminClient.from("payment_requests").delete().in("project_id", projectIds)
    await adminClient.from("form_responses").delete().in("project_id", projectIds)
    await adminClient.from("activity_log").delete().in("project_id", projectIds)
    await adminClient.from("project_status_updates").delete().in("project_id", projectIds)

    // Delete the projects
    await adminClient.from("projects").delete().in("id", projectIds)
  }

  // 3. Delete the client_users records (we already deleted auth users above)
  await adminClient.from("client_users").delete().eq("client_id", params.id)

  // 4. Finally, delete the client
  const { error } = await adminClient
    .from("clients")
    .delete()
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
