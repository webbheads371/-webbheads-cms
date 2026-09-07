import { db } from "@/db"
import { clients, projects } from "@/db/schema"
import { desc, eq, count } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/actions/server"
import { ClientsClient } from "./clients-client"

export const dynamic = "force-dynamic"

export default async function ClientsPage() {
  const staff = await getCurrentStaff()
  const role = staff?.role || "sales"

  const clientsData = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.created_at))
    .limit(100)

  const clientsWithCount = await Promise.all(
    clientsData.map(async (c) => {
      const [res] = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.client_id, c.id))

      return {
        ...c,
        projects: [{ count: res?.count ?? 0 }],
      }
    })
  )

  return <ClientsClient clients={clientsWithCount as any} role={role} />
}
