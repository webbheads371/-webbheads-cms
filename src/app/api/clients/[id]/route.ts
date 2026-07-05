import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * DELETE /api/clients/[id]
 * Admin-only: deletes a client and cascades to their
 * portal login (client_users) and projects.
 * Uses service-role key to bypass RLS entirely.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const clientId = params.id
  console.log("[DELETE API] ▶ Request for client id:", clientId)

  const cookieStore = cookies()

  // ── Anon client – just for auth check ──────────────────────────────────────
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set: () => {}, remove: () => {} } }
  )

  // ── Admin client – service role bypasses ALL RLS ────────────────────────────
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set: () => {}, remove: () => {} } }
  )

  // ── 0. Verify caller is authenticated ──────────────────────────────────────
  const { data: { user } } = await anonClient.auth.getUser()
  console.log("[DELETE API] Auth user:", user?.email ?? "none")
  if (!user) {
    return NextResponse.json({ error: "Unauthorized – please log in" }, { status: 401 })
  }

  // ── 1. Verify caller is admin or tech_lead ─────────────────────────────────
  const { data: caller, error: staffErr } = await adminClient
    .from("staff")
    .select("role")
    .eq("id", user.id)
    .single()

  console.log("[DELETE API] Caller role:", caller?.role, "| staffErr:", staffErr?.message)

  if (!caller) {
    return NextResponse.json(
      { error: `Staff record not found for your account. (${staffErr?.message ?? "unknown"})` },
      { status: 403 }
    )
  }

  if (caller.role !== "admin" && caller.role !== "tech_lead") {
    return NextResponse.json(
      { error: `Only admins and tech leads can delete clients. Your role: ${caller.role}` },
      { status: 403 }
    )
  }

  // ── 2. Get all project IDs for this client ─────────────────────────────────
  const { data: projects, error: projectsErr } = await adminClient
    .from("projects")
    .select("id")
    .eq("client_id", clientId)

  if (projectsErr) {
    console.error("[DELETE API] Failed to fetch projects:", projectsErr.message)
    return NextResponse.json({ error: "Failed to fetch client projects: " + projectsErr.message }, { status: 500 })
  }

  const projectIds = (projects ?? []).map((p) => p.id)
  console.log("[DELETE API] Project IDs to delete:", projectIds)

  // ── 3. Delete all project-related child records ───────────────────────────
  if (projectIds.length > 0) {
    const childTables = [
      "documents",
      "agreements",
      "payment_requests",
      "payments",
      "form_responses",
      "activity_log",
      "project_status_updates",
      "project_checklist_items",
    ] as const

    for (const table of childTables) {
      const { error: delErr } = await adminClient
        .from(table)
        .delete()
        .in("project_id", projectIds)

      if (delErr) {
        // Log but don't abort – some tables may simply have no rows (not an error)
        console.warn(`[DELETE API] Warning deleting from ${table}:`, delErr.message)
        // Only abort on hard errors (not "no rows affected")
        if (!delErr.message.includes("no rows")) {
          // Some Supabase errors indicate the table genuinely doesn't exist or
          // there's a real FK violation – surface that
          console.error(`[DELETE API] Hard error on ${table}:`, delErr)
          return NextResponse.json(
            { error: `Failed to delete records from ${table}: ${delErr.message}` },
            { status: 500 }
          )
        }
      } else {
        console.log(`[DELETE API] ✓ Cleared ${table}`)
      }
    }

    // ── 4. Delete the projects themselves ──────────────────────────────────
    const { error: projDelErr } = await adminClient
      .from("projects")
      .delete()
      .in("id", projectIds)

    if (projDelErr) {
      console.error("[DELETE API] Failed to delete projects:", projDelErr.message)
      return NextResponse.json(
        { error: "Failed to delete projects: " + projDelErr.message },
        { status: 500 }
      )
    }
    console.log("[DELETE API] ✓ Deleted projects")
  }

  // ── 5. Delete portal auth accounts (auth.users) ───────────────────────────
  const { data: clientUsers } = await adminClient
    .from("client_users")
    .select("id")
    .eq("client_id", clientId)

  console.log("[DELETE API] Client portal users:", clientUsers?.length ?? 0)

  if (clientUsers && clientUsers.length > 0) {
    for (const cu of clientUsers) {
      const { error: authDelErr } = await adminClient.auth.admin.deleteUser(cu.id)
      if (authDelErr) {
        console.warn(`[DELETE API] Warning: could not delete auth user ${cu.id}:`, authDelErr.message)
        // Not a hard stop – the client_users row will still be deleted below
      } else {
        console.log(`[DELETE API] ✓ Deleted auth user ${cu.id}`)
      }
    }
  }

  // ── 6. Delete client_users rows ───────────────────────────────────────────
  const { error: cuDelErr } = await adminClient
    .from("client_users")
    .delete()
    .eq("client_id", clientId)

  if (cuDelErr) {
    console.error("[DELETE API] Failed to delete client_users:", cuDelErr.message)
    return NextResponse.json(
      { error: "Failed to delete client users: " + cuDelErr.message },
      { status: 500 }
    )
  }
  console.log("[DELETE API] ✓ Deleted client_users")

  // ── 7. Delete the client record ───────────────────────────────────────────
  const { error: clientDelErr } = await adminClient
    .from("clients")
    .delete()
    .eq("id", clientId)

  if (clientDelErr) {
    console.error("[DELETE API] Failed to delete client:", clientDelErr.message)
    return NextResponse.json(
      { error: "Failed to delete client: " + clientDelErr.message },
      { status: 500 }
    )
  }

  console.log("[DELETE API] ✅ SUCCESS – client deleted:", clientId)
  return NextResponse.json({ ok: true })
}
