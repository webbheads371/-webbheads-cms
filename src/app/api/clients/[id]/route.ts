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

  // Delete the client (cascade in DB handles projects, payments, etc.)
  const { error } = await adminClient
    .from("clients")
    .delete()
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
