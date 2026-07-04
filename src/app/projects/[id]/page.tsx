import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProjectDetailClient } from "./project-detail-client"

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("*, client:clients(*), tech_lead:staff!projects_tech_lead_id_fkey(*), content_lead:staff!projects_content_lead_id_fkey(*)")
    .eq("id", params.id)
    .single()

  if (!project) notFound()

  // Fetch reference and checklist data first to initialize missing ones
  const [
    { data: stages },
    { data: templates },
    { data: existingItems },
  ] = await Promise.all([
    supabase.from("pipeline_stages").select("*").order("sort_order"),
    supabase.from("checklist_templates").select("*"),
    supabase.from("project_checklist_items").select("*").eq("project_id", params.id),
  ])

  let checklistItems = existingItems || []

  // Ensure all active checklist items are initialized
  if (stages && templates && existingItems) {
    const activeStageKeys = stages
      .filter((s) => !["closed_won", "closed_lost"].includes(s.key))
      .map((s) => s.key)

    // Filter templates to only those in active stages, unless project stage is closed_lost
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
        is_required: t.is_required,
        is_done: false,
      }))

      await supabase.from("project_checklist_items").insert(itemsToInsert)

      // Fetch again to get all items
      const { data: updatedItems } = await supabase
        .from("project_checklist_items")
        .select("*")
        .eq("project_id", params.id)
      
      checklistItems = updatedItems || []
    }
  }

  // Fetch remaining details
  const [
    { data: payments },
    { data: documents },
    { data: activity },
    { data: agreement },
    { data: paymentRequests },
    { data: formResponses },
    { data: statusUpdates },
  ] = await Promise.all([
    supabase.from("payments").select("*").eq("project_id", params.id).order("created_at", { ascending: false }),
    supabase.from("documents").select("*").eq("project_id", params.id).order("uploaded_at", { ascending: false }),
    supabase.from("activity_log").select("*, actor:staff(id, full_name)").eq("project_id", params.id).order("created_at", { ascending: false }),
    supabase.from("agreements").select("*").eq("project_id", params.id).single(),
    supabase.from("payment_requests").select("*").eq("project_id", params.id).order("created_at"),
    supabase.from("form_responses").select("*, template:form_templates(*)").eq("project_id", params.id),
    supabase.from("project_status_updates").select("*").eq("project_id", params.id).order("posted_at", { ascending: false }),
  ])

  const user = await supabase.auth.getUser()
  const { data: currentStaff } = await supabase
    .from("staff")
    .select("*")
    .eq("id", user.data.user?.id)
    .single()

  return (
    <ProjectDetailClient
      project={project}
      stages={stages || []}
      checklistItems={checklistItems || []}
      payments={payments || []}
      documents={documents || []}
      activity={activity || []}
      currentStaff={currentStaff}
      agreement={agreement ?? null}
      paymentRequests={paymentRequests || []}
      formResponses={formResponses || []}
      statusUpdates={statusUpdates || []}
    />
  )
}

