import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { DashboardClientTabs } from "./_components/dashboard-client-tabs"
import { ChangePasswordForm } from "./_components/change-password-form"
import { ClientGreeting } from "./_components/client-greeting"
import type { Document, PaymentRequest, BankSettings, ProjectStatusUpdate, FormTemplate, FormResponse } from "@/types"

export default async function DashboardPage() {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const supabase = createClient()

  // Fetch project with tech lead and content lead details
  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      client:clients(*),
      tech_lead:staff!tech_lead_id(full_name, email),
      content_lead:staff!content_lead_id(full_name, email)
    `)
    .eq("client_id", clientUser.client_id)
    .single()

  if (!project) redirect("/portal")

  // If onboarding not done, send back
  if (!project.profile_submitted_at) redirect("/portal/onboarding")

  const projectId = project.id

  // Fetch all needed data in parallel
  const [
    { data: documents },
    { data: paymentRequests },
    { data: bankSettings },
    { data: statusUpdates },
    { data: formResponses },
    { data: allTemplates },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_client_visible", true)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("payment_requests")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("bank_settings")
      .select("*")
      .eq("id", 1)
      .single(),
    supabase
      .from("project_status_updates")
      .select("*")
      .eq("project_id", projectId)
      .eq("visible_to_client", true)
      .order("posted_at", { ascending: false }),
    supabase
      .from("form_responses")
      .select("*")
      .eq("project_id", projectId),
    supabase
      .from("form_templates")
      .select("*")
      .order("sort_order", { ascending: true }),
  ])

  // Filter form templates to match client type
  const clientType = project.client?.client_type ?? "both"
  const formTemplates = (allTemplates ?? []).filter((t) => {
    if (t.scope === "general") return true
    if (clientType === "both") return true
    return t.scope === clientType
  })

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 dashboard-header">
        <div>
          <ClientGreeting clientName={project.client?.contact_name || project.client?.company_name || "Client"} />
          <p className="dashboard-subtitle">
            Track your project updates, manage payments, credentials, and documents in one place.
          </p>
        </div>
        <div className="flex-shrink-0 flex justify-end">
          <ChangePasswordForm />
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-slate-500 py-6">Loading dashboard content...</div>}>
        <DashboardClientTabs
          project={project}
          paymentRequests={(paymentRequests ?? []) as PaymentRequest[]}
          bankSettings={bankSettings as BankSettings | null}
          statusUpdates={(statusUpdates ?? []) as ProjectStatusUpdate[]}
          documents={documents ?? []}
          formTemplates={(formTemplates ?? []) as FormTemplate[]}
          formResponses={(formResponses ?? []) as FormResponse[]}
        />
      </Suspense>
    </div>
  )
}

