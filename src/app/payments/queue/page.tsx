import { db } from "@/db"
import { payment_requests, projects, clients } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PaymentQueueClient } from "./payment-queue-client"

export default async function PaymentQueuePage() {
  const staff = await getCurrentStaff()
  if (!staff || staff.role !== "admin") {
    redirect("/dashboard")
  }

  const rawRequests = await db
    .select({
      request: payment_requests,
      project: projects,
      client: clients,
    })
    .from(payment_requests)
    .innerJoin(projects, eq(payment_requests.project_id, projects.id))
    .leftJoin(clients, eq(projects.client_id, clients.id))
    .where(eq(payment_requests.status, "submitted"))
    .orderBy(asc(payment_requests.submitted_at))

  const submittedPayments = rawRequests.map((row) => ({
    ...row.request,
    submitted_at: row.request.submitted_at ? row.request.submitted_at.toISOString() : null,
    created_at: row.request.created_at ? row.request.created_at.toISOString() : null,
    project: {
      id: row.project.id,
      name: row.project.name,
      project_value: row.project.project_value,
      client: row.client ?? null,
    },
  }))

  return (
    <div className="page-container">
      <div className="page-header-wrapper">
        <h1 className="page-title">Payment Verification Queue</h1>
        <p className="page-subtitle">
          Review and approve or reject client payment screenshots.
        </p>
      </div>
      <PaymentQueueClient payments={submittedPayments as any} />
    </div>
  )
}
