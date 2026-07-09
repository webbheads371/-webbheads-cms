import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { DashboardClientTabs } from "./_components/dashboard-client-tabs"
import { MobileDashboardActions } from "./_components/mobile-dashboard-actions"
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
      content_lead:staff!content_lead_id(full_name, email),
      sales_lead:staff!sales_lead_id(full_name, email)
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
    <div className="dashboard-layout flex flex-col gap-[32px] px-2 md:px-4">
      <div className="flex flex-row items-start md:items-center justify-between gap-2 md:gap-6 w-full">
        {/* Mobile Logo (hidden on md and above since PortalSidebar handles it) */}
        <div className="flex md:hidden items-center shrink-0">
          <img
            src="/logo.png"
            alt="WebbHeads Logo"
            className="h-9 w-9 rounded-xl bg-black p-0.5 object-contain shadow-sm"
          />
        </div>
        
        <div className="flex items-center justify-end gap-2">
          <MobileDashboardActions />
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

