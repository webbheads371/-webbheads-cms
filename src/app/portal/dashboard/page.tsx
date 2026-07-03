import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { TimelineSection } from "./_components/timeline-section"
import { FinalInvoiceSection } from "./_components/final-invoice-section"
import { HandlesSection } from "./_components/handles-section"
import { StatusFeed } from "./_components/status-feed"
import { ChangePasswordForm } from "./_components/change-password-form"
import type { Document, PaymentRequest, BankSettings, ProjectStatusUpdate } from "@/types"

export default async function DashboardPage() {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const supabase = createClient()

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientUser.client_id)
    .single()

  if (!project) redirect("/portal")

  // If onboarding not done, send back
  if (!project.profile_submitted_at) redirect("/portal/onboarding")

  const projectId = project.id

  // Fetch all needed data in parallel
  const [
    { data: timelineDocs },
    { data: finalPayment },
    { data: bankSettings },
    { data: statusUpdates },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .in("doc_type", ["timeline", "tech_flow"])
      .eq("is_client_visible", true)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("payment_requests")
      .select("*")
      .eq("project_id", projectId)
      .eq("request_type", "final")
      .eq("released", true)
      .single(),
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
  ])

  const hasAnySections =
    (timelineDocs && timelineDocs.length > 0) ||
    finalPayment ||
    project.handles_collected ||
    (statusUpdates && statusUpdates.length > 0)

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 dashboard-header">
        <div>
          <h1 className="dashboard-title">Your Project Dashboard</h1>
          <p className="dashboard-subtitle">
            Track your project progress in real time. Sections appear as your project advances.
          </p>
        </div>
        <div className="flex-shrink-0 flex justify-end">
          <ChangePasswordForm />
        </div>
      </div>

      {!hasAnySections && (
        <div className="dashboard-holding-card">
          <div className="dashboard-holding-icon">⏳</div>
          <h2>We&apos;re getting started on your project!</h2>
          <p>
            Thank you for completing onboarding. Our team will share your project timeline and
            updates here as work progresses. You&apos;ll see sections appear automatically — no
            refresh needed.
          </p>
        </div>
      )}

      <div className="dashboard-sections">
        {/* Timeline — always shown (even empty) once in dashboard */}
        <TimelineSection documents={(timelineDocs ?? []) as Document[]} />

        {/* Final Invoice — only shown when released */}
        {finalPayment && (
          <FinalInvoiceSection
            projectId={projectId}
            paymentRequest={finalPayment as PaymentRequest}
            bankSettings={bankSettings as BankSettings | null}
          />
        )}

        {/* Handles collected — only shown when Admin marks it */}
        {project.handles_collected && project.handles_collected_at && (
          <HandlesSection handlesCollectedAt={project.handles_collected_at} />
        )}

        {/* Status feed — shown if any updates exist */}
        <StatusFeed updates={(statusUpdates ?? []) as ProjectStatusUpdate[]} />
      </div>
    </div>
  )
}
