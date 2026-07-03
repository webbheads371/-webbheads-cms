import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { WizardStepper } from "./_components/wizard-stepper"
import { StepWelcome } from "./_components/step-welcome"
import { StepAgreement } from "./_components/step-agreement"
import { StepPayment } from "./_components/step-payment"
import { StepProfile } from "./_components/step-profile"
import type { Agreement, BankSettings, PaymentRequest, FormTemplate, FormResponse, ClientType } from "@/types"

export default async function OnboardingPage() {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const supabase = createClient()

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("*, client:clients(*)")
    .eq("client_id", clientUser.client_id)
    .single()

  if (!project) {
    return (
      <div className="portal-holding">
        <h1>No project found</h1>
        <p>Please contact the WebbHeads team to get your project set up.</p>
      </div>
    )
  }

  // Already finished onboarding → send to dashboard
  if (project.profile_submitted_at) {
    redirect("/portal/dashboard")
  }

  // ── Determine current step ──────────────────────────────────────────────────
  let currentStep = 1

  // Step 1: Welcome seen?
  if (!project.welcome_seen_at) {
    currentStep = 1
  } else {
    // Step 2: Agreement agreed AND signature uploaded?
    const { data: agreement } = await supabase
      .from("agreements")
      .select("*")
      .eq("project_id", project.id)
      .single()

    const agreementComplete =
      agreement?.client_agreed === true && !!agreement?.signature_url

    if (!agreementComplete) {
      currentStep = 2

      return (
        <div className="wizard-layout">
          <WizardStepper currentStep={currentStep} />
          <div className="wizard-card">
            {agreement ? (
              <StepAgreement projectId={project.id} agreement={agreement as Agreement} />
            ) : (
              <div className="info-banner">
                Your agreement is being prepared. Please check back shortly.
              </div>
            )}
          </div>
        </div>
      )
    }

    // Step 3: Advance payment approved?
    let { data: advancePayment } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("project_id", project.id)
      .eq("request_type", "advance")
      .single()

    if (!advancePayment) {
      const amount =
        project.project_value && project.advance_percent
          ? (project.project_value * project.advance_percent) / 100
          : project.project_value
            ? project.project_value * 0.5
            : 0

      if (amount > 0) {
        const adminClient = createAdminClient()
        const { data: newPayment, error: createError } = await adminClient
          .from("payment_requests")
          .insert({
            project_id: project.id,
            request_type: "advance",
            amount: amount,
            status: "pending_payment",
          })
          .select()
          .single()

        if (!createError && newPayment) {
          advancePayment = newPayment
        }
      }
    }

    const advanceApproved = advancePayment?.status === "approved"

    if (!advanceApproved) {
      currentStep = 3

      // Fetch bank settings
      const { data: bankSettings } = await supabase
        .from("bank_settings")
        .select("*")
        .eq("id", 1)
        .single()

      return (
        <div className="wizard-layout">
          <WizardStepper currentStep={currentStep} />
          <div className="wizard-card">
            <StepPayment
              projectId={project.id}
              project={{
                project_value: project.project_value,
                advance_percent: project.advance_percent ?? 50,
              }}
              bankSettings={bankSettings as BankSettings | null}
              paymentRequest={advancePayment as PaymentRequest | null}
            />
          </div>
        </div>
      )
    }

    // Step 4: Profile submitted?
    currentStep = 4

    const clientType = (project.client as { client_type?: ClientType })?.client_type ?? "both"

    // Fetch applicable form templates
    const { data: allTemplates } = await supabase
      .from("form_templates")
      .select("*")
      .order("sort_order", { ascending: true })

    const templates: FormTemplate[] = (allTemplates ?? []).filter((t) => {
      if (t.scope === "general") return true
      if (clientType === "both") return true
      return t.scope === clientType
    })

    // Fetch existing responses
    const { data: existingResponses } = await supabase
      .from("form_responses")
      .select("*")
      .eq("project_id", project.id)

    return (
      <div className="wizard-layout">
        <WizardStepper currentStep={currentStep} />
        <div className="wizard-card">
          <StepProfile
            projectId={project.id}
            templates={templates}
            existingResponses={(existingResponses ?? []) as FormResponse[]}
          />
        </div>
      </div>
    )
  }

  // Default render for Step 1 (Welcome)
  return (
    <div className="wizard-layout">
      <WizardStepper currentStep={1} />
      <div className="wizard-card">
        <StepWelcome
          clientName={clientUser.full_name}
          projectId={project.id}
        />
      </div>
    </div>
  )
}
