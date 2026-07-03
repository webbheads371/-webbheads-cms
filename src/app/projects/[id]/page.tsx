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

  const [
    { data: stages },
    { data: checklistItems },
    { data: payments },
    { data: documents },
    { data: activity },
    { data: agreement },
    { data: paymentRequests },
    { data: formResponses },
    { data: statusUpdates },
  ] = await Promise.all([
    supabase.from("pipeline_stages").select("*").order("sort_order"),
    supabase.from("project_checklist_items").select("*").eq("project_id", params.id).order("stage_key").order("category"),
    supabase.from("payments").select("*").eq("project_id", params.id).order("created_at", { ascending: false }),
    supabase.from("documents").select("*").eq("project_id", params.id).order("uploaded_at", { ascending: false }),
    supabase.from("activity_log").select("*, actor:staff(id, full_name)").eq("project_id", params.id).order("created_at", { ascending: false }),
    // Phase 2
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

