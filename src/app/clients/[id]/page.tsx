import { db } from "@/db"
import { clients, client_users, projects } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ClientDetailClient } from "./client-detail-client"

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const staff = await getCurrentStaff()
  const role = staff?.role || "sales"

  const [clientRecord] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, params.id))

  if (!clientRecord) notFound()

  const clientUsersData = await db
    .select()
    .from(client_users)
    .where(eq(client_users.client_id, params.id))

  const client = {
    ...clientRecord,
    client_users: clientUsersData,
  }

  const projectsData = await db
    .select()
    .from(projects)
    .where(eq(projects.client_id, params.id))
    .orderBy(desc(projects.created_at))

  return <ClientDetailClient client={client as any} projects={projectsData as any} role={role} />
}
