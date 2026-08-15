import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { db } from "@/db"
import {
  projects,
  clients,
  staff,
  documents,
  payment_requests,
  bank_settings,
  project_status_updates,
  form_responses,
  form_templates,
  content_schedule,
} from "@/db/schema"
import { eq, and, desc, asc } from "drizzle-orm"
import { DashboardClientTabs } from "./_components/dashboard-client-tabs"
import { MobileDashboardActions } from "./_components/mobile-dashboard-actions"
import type {
  Document,
  PaymentRequest,
  BankSettings,
  ProjectStatusUpdate,
  FormTemplate,
  FormResponse,
  ContentSchedule,
} from "@/types"

export default async function DashboardPage() {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const [projectRecord] = await db
    .select()
    .from(projects)
    .where(eq(projects.client_id, clientUser.client_id))

  if (!projectRecord) redirect("/portal")
  if (!projectRecord.profile_submitted_at) redirect("/portal/onboarding")

  const projectId = projectRecord.id

  const [clientRecord] = projectRecord.client_id
    ? await db.select().from(clients).where(eq(clients.id, projectRecord.client_id))
    : [null]

  const [techLead] = projectRecord.tech_lead_id
    ? await db
        .select({ full_name: staff.full_name, email: staff.email })
        .from(staff)
        .where(eq(staff.id, projectRecord.tech_lead_id))
    : [null]

  const [contentLead] = projectRecord.content_lead_id
    ? await db
        .select({ full_name: staff.full_name, email: staff.email })
        .from(staff)
        .where(eq(staff.id, projectRecord.content_lead_id))
    : [null]

  const [salesLead] = projectRecord.sales_lead_id
    ? await db
        .select({ full_name: staff.full_name, email: staff.email })
        .from(staff)
        .where(eq(staff.id, projectRecord.sales_lead_id))
    : [null]

  const project = {
    ...projectRecord,
    client: clientRecord ?? null,
    tech_lead: techLead ?? null,
    content_lead: contentLead ?? null,
    sales_lead: salesLead ?? null,
  }

  const [
    documentsData,
    paymentRequestsData,
    [bankSettingsData],
    statusUpdatesData,
    formResponsesData,
    allTemplates,
    contentScheduleRaw,
  ] = await Promise.all([
    db
      .select()
      .from(documents)
      .where(and(eq(documents.project_id, projectId), eq(documents.is_client_visible, true)))
      .orderBy(desc(documents.uploaded_at)),
    db
      .select()
      .from(payment_requests)
      .where(eq(payment_requests.project_id, projectId))
      .orderBy(asc(payment_requests.created_at)),
    db.select().from(bank_settings).where(eq(bank_settings.id, 1)),
    db
      .select()
      .from(project_status_updates)
      .where(and(eq(project_status_updates.project_id, projectId), eq(project_status_updates.visible_to_client, true)))
      .orderBy(desc(project_status_updates.posted_at)),
    db.select().from(form_responses).where(eq(form_responses.project_id, projectId)),
    db.select().from(form_templates).orderBy(asc(form_templates.sort_order)),
    db.select().from(content_schedule).where(eq(content_schedule.project_id, projectId)).orderBy(asc(content_schedule.scheduled_at)),
  ])

  const clientType = project.client?.client_type ?? "both"
  const formTemplates = (allTemplates ?? []).filter((t) => {
    if (t.scope === "general") return true
    if (clientType === "both") return true
    return t.scope === clientType
  })

  const contentScheduleData = contentScheduleRaw.map((cs) => ({
    ...cs,
    scheduled_at: cs.scheduled_at.toISOString(),
  }))

  const paymentRequests = (paymentRequestsData ?? []).map((p) => ({
    ...p,
    amount: Number(p.amount),
  }))

  return (
    <div className="dashboard-layout flex flex-col gap-[32px] px-2 md:px-4">
      <div className="flex flex-row items-start md:items-center justify-between gap-2 md:gap-6 w-full">
        <div className="flex md:hidden items-center shrink-0">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="/logo.png" alt="WebbHeads Logo" className="h-7 w-7 object-contain" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <MobileDashboardActions />
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-slate-500 py-6">Loading dashboard content...</div>}>
        <DashboardClientTabs
          project={project as any}
          paymentRequests={paymentRequests as any}
          bankSettings={(bankSettingsData as any) || null}
          statusUpdates={(statusUpdatesData as any) || []}
          documents={documentsData as any}
          formTemplates={(formTemplates as any) || []}
          formResponses={(formResponsesData as any) || []}
          contentSchedule={(contentScheduleData as any) || []}
        />
      </Suspense>
    </div>
  )
}
