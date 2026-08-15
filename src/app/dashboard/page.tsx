import { db } from "@/db"
import { projects, pipeline_stages, payments, clients } from "@/db/schema"
import { asc, eq } from "drizzle-orm"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const allProjectsRaw = await db
    .select({
      project: projects,
      client: clients,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.client_id, clients.id))
    .limit(50)

  const projectsData = allProjectsRaw.map((row) => ({
    ...row.project,
    client: row.client ?? null,
  }))

  const stagesData = await db
    .select()
    .from(pipeline_stages)
    .orderBy(asc(pipeline_stages.sort_order))

  const paymentsData = await db
    .select({ amount: payments.amount })
    .from(payments)

  const totalProjectValue = projectsData.reduce(
    (sum, p) => sum + (Number(p.project_value) || 0),
    0
  )
  const totalPaid = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPendingPayments = Math.max(0, totalProjectValue - totalPaid)

  return (
    <DashboardClient
      projects={projectsData as any}
      stages={stagesData}
      totalPendingPayments={totalPendingPayments}
    />
  )
}
