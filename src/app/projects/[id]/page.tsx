import { db } from "@/db"
import {
  projects,
  clients,
  staff,
  pipeline_stages,
  checklist_templates,
  project_checklist_items,
  payments,
  documents,
  activity_log,
  agreements,
  payment_requests,
  form_responses,
  form_templates,
  project_status_updates,
  content_schedule,
} from "@/db/schema"
import { eq, desc, asc, inArray } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/actions/server"
import { notFound } from "next/navigation"
import { ProjectDetailClient } from "./project-detail-client"

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [projectRecord] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, params.id))

  if (!projectRecord) notFound()

  // Fetch client details
  const [clientRecord] = projectRecord.client_id
    ? await db.select().from(clients).where(eq(clients.id, projectRecord.client_id))
    : [null]

  // Fetch leads details
  const [techLead] = projectRecord.tech_lead_id
    ? await db.select().from(staff).where(eq(staff.id, projectRecord.tech_lead_id))
    : [null]

  const [contentLead] = projectRecord.content_lead_id
    ? await db.select().from(staff).where(eq(staff.id, projectRecord.content_lead_id))
    : [null]

  const [salesLead] = projectRecord.sales_lead_id
    ? await db.select().from(staff).where(eq(staff.id, projectRecord.sales_lead_id))
    : [null]

  const project = {
    ...projectRecord,
    client: clientRecord ?? null,
    tech_lead: techLead ?? null,
    content_lead: contentLead ?? null,
    sales_lead: salesLead ?? null,
  }

  const [stages, templates, existingItems] = await Promise.all([
    db.select().from(pipeline_stages).orderBy(asc(pipeline_stages.sort_order)),
    db.select().from(checklist_templates),
    db.select().from(project_checklist_items).where(eq(project_checklist_items.project_id, params.id)),
  ])

  let checklistItems = existingItems || []

  if (stages && templates && existingItems) {
    const activeStageKeys = stages
      .filter((s) => !["closed_won", "closed_lost"].includes(s.key))
      .map((s) => s.key)

    const relevantTemplates = templates.filter((t) =>
      project.current_stage === "closed_lost"
        ? t.stage_key === "closed_lost"
        : activeStageKeys.includes(t.stage_key)
    )

    const existingTemplateIds = new Set(existingItems.map((i) => i.template_id))
    const missingTemplates = relevantTemplates.filter((t) => !existingTemplateIds.has(t.id))

    if (missingTemplates.length > 0) {
      const itemsToInsert = missingTemplates.map((t) => ({
        project_id: params.id,
        template_id: t.id,
        stage_key: t.stage_key,
        label: t.label,
        category: t.category,
        is_required: t.is_required ?? true,
        is_done: false,
      }))

      await db.insert(project_checklist_items).values(itemsToInsert)

      checklistItems = await db
        .select()
        .from(project_checklist_items)
        .where(eq(project_checklist_items.project_id, params.id))
    }
  }

  const [
    paymentsData,
    documentsData,
    activityDataRaw,
    [agreementData],
    paymentRequestsData,
    formResponsesRaw,
    statusUpdatesData,
    contentScheduleRaw,
    staffListData,
    currentStaff,
  ] = await Promise.all([
    db.select().from(payments).where(eq(payments.project_id, params.id)).orderBy(desc(payments.created_at)),
    db.select().from(documents).where(eq(documents.project_id, params.id)).orderBy(desc(documents.uploaded_at)),
    db.select().from(activity_log).where(eq(activity_log.project_id, params.id)).orderBy(desc(activity_log.created_at)),
    db.select().from(agreements).where(eq(agreements.project_id, params.id)),
    db.select().from(payment_requests).where(eq(payment_requests.project_id, params.id)).orderBy(asc(payment_requests.created_at)),
    db.select().from(form_responses).where(eq(form_responses.project_id, params.id)),
    db.select().from(project_status_updates).where(eq(project_status_updates.project_id, params.id)).orderBy(desc(project_status_updates.posted_at)),
    db.select().from(content_schedule).where(eq(content_schedule.project_id, params.id)).orderBy(asc(content_schedule.scheduled_at)),
    db.select().from(staff),
    getCurrentStaff(),
  ])

  // Attach actor to activity log
  const actorIds = Array.from(new Set(activityDataRaw.map((a) => a.actor_id).filter((id): id is string => Boolean(id))))
  const actors = actorIds.length > 0 ? await db.select({ id: staff.id, full_name: staff.full_name }).from(staff).where(inArray(staff.id, actorIds)) : []
  const actorMap = new Map(actors.map((a) => [a.id, a]))
  const activityData = activityDataRaw.map((a) => ({
    ...a,
    actor: a.actor_id ? actorMap.get(a.actor_id) ?? null : null,
  }))

  // Attach template to form responses
  const templateIds = Array.from(new Set(formResponsesRaw.map((fr) => fr.template_id)))
  const templatesForResponses = templateIds.length > 0 ? await db.select().from(form_templates).where(inArray(form_templates.id, templateIds)) : []
  const templateMap = new Map(templatesForResponses.map((t) => [t.id, t]))
  const formResponsesData = formResponsesRaw.map((fr) => ({
    ...fr,
    template: templateMap.get(fr.template_id) ?? null,
  }))

  const contentScheduleData = contentScheduleRaw.map((cs) => ({
    ...cs,
    scheduled_at: cs.scheduled_at.toISOString(),
  }))

  return (
    <ProjectDetailClient
      project={project as any}
      stages={(stages as any) || []}
      checklistItems={(checklistItems as any) || []}
      payments={(paymentsData as any) || []}
      documents={(documentsData as any) || []}
      activity={activityData as any}
      currentStaff={currentStaff as any}
      agreement={agreementData as any}
      paymentRequests={(paymentRequestsData as any) || []}
      formResponses={formResponsesData as any}
      statusUpdates={(statusUpdatesData as any) || []}
      contentSchedule={contentScheduleData as any}
      staffList={(staffListData as any) || []}
    />
  )
}
