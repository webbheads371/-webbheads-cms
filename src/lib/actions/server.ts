import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { staff, client_users, clients } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

export async function getCurrentStaff() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const [staffMember] = await db
    .select()
    .from(staff)
    .where(eq(staff.id, session.user.id))

  return staffMember ?? null
}

export async function getCurrentClientUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const [clientUser] = await db
    .select()
    .from(client_users)
    .where(eq(client_users.id, session.user.id))

  if (!clientUser) return null

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientUser.client_id))

  return {
    ...clientUser,
    client: client ?? null,
  }
}

// Stubs for legacy Supabase compatibility if needed during migration
export function createClient() {
  return null as any
}

export function createAdminClient() {
  return null as any
}
