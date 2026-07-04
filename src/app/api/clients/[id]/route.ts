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
  console.log("[DELETE API] Request received for client id:", params.id)
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
  console.log("[DELETE API] Auth user:", user?.email)
  if (!user) {
    console.log("[DELETE API] Unauthorized: No user session found")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: caller } = await adminClient
    .from("staff")
    .select("role")
    .eq("id", user.id)
    .single()

  console.log("[DELETE API] Caller role:", caller?.role)
  if (caller?.role !== "admin" && caller?.role !== "tech_lead") {
    console.log("[DELETE API] Forbidden: Caller is not admin or tech_lead")
    return NextResponse.json({ error: "Only admins and tech leads can delete clients" }, { status: 403 })
  }

  // Delete any portal login auth accounts for this client
  const { data: clientUsers } = await adminClient
    .from("client_users")
    .select("id")
    .eq("client_id", params.id)

  console.log("[DELETE API] Client users to delete:", clientUsers)
  if (clientUsers && clientUsers.length > 0) {
    for (const cu of clientUsers) {
      const { error: authDelErr } = await adminClient.auth.admin.deleteUser(cu.id)
      console.log(`[DELETE API] Auth delete user ${cu.id} result:`, authDelErr)
    }
  }

  // 1. Get all projects for this client
  const { data: projects } = await adminClient
    .from("projects")
    .select("id")
    .eq("client_id", params.id)

  const projectIds = projects?.map((p) => p.id) || []
  console.log("[DELETE API] Projects to delete:", projectIds)

  // 2. Delete all project-related data if there are projects
  if (projectIds.length > 0) {
    const p1 = await adminClient.from("documents").delete().in("project_id", projectIds)
    if (p1.error) {
      console.log("[DELETE API] documents delete error:", p1.error)
      return NextResponse.json({ error: p1.error.message }, { status: 500 })
    }
    const p2 = await adminClient.from("agreements").delete().in("project_id", projectIds)
    if (p2.error) {
      console.log("[DELETE API] agreements delete error:", p2.error)
      return NextResponse.json({ error: p2.error.message }, { status: 500 })
    }
    const p3 = await adminClient.from("payment_requests").delete().in("project_id", projectIds)
    if (p3.error) {
      console.log("[DELETE API] payment_requests delete error:", p3.error)
      return NextResponse.json({ error: p3.error.message }, { status: 500 })
    }
    const p4 = await adminClient.from("payments").delete().in("project_id", projectIds)
    if (p4.error) {
      console.log("[DELETE API] payments delete error:", p4.error)
      return NextResponse.json({ error: p4.error.message }, { status: 500 })
    }
    const p5 = await adminClient.from("form_responses").delete().in("project_id", projectIds)
    if (p5.error) {
      console.log("[DELETE API] form_responses delete error:", p5.error)
      return NextResponse.json({ error: p5.error.message }, { status: 500 })
    }
    const p6 = await adminClient.from("activity_log").delete().in("project_id", projectIds)
    if (p6.error) {
      console.log("[DELETE API] activity_log delete error:", p6.error)
      return NextResponse.json({ error: p6.error.message }, { status: 500 })
    }
    const p7 = await adminClient.from("project_status_updates").delete().in("project_id", projectIds)
    if (p7.error) {
      console.log("[DELETE API] project_status_updates delete error:", p7.error)
      return NextResponse.json({ error: p7.error.message }, { status: 500 })
    }
    const p8 = await adminClient.from("project_checklist_items").delete().in("project_id", projectIds)
    if (p8.error) {
      console.log("[DELETE API] project_checklist_items delete error:", p8.error)
      return NextResponse.json({ error: p8.error.message }, { status: 500 })
    }

    // Delete the projects
    const p9 = await adminClient.from("projects").delete().in("id", projectIds)
    if (p9.error) {
      console.log("[DELETE API] projects delete error:", p9.error)
      return NextResponse.json({ error: p9.error.message }, { status: 500 })
    }
  }

  // 3. Delete the client_users records (we already deleted auth users above)
  const p10 = await adminClient.from("client_users").delete().eq("client_id", params.id)
  if (p10.error) {
    console.log("[DELETE API] client_users delete error:", p10.error)
    return NextResponse.json({ error: p10.error.message }, { status: 500 })
  }

  // 4. Finally, delete the client
  const { error } = await adminClient
    .from("clients")
    .delete()
    .eq("id", params.id)

  if (error) {
    console.log("[DELETE API] client delete error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[DELETE API] SUCCESS deleting client")
  return NextResponse.json({ ok: true })
}
