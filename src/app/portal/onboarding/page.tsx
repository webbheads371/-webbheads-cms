import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/actions/server"
import { db } from "@/db"
import {
  projects,
  clients,
  agreements,
  payment_requests,
  bank_settings,
  form_templates,
  form_responses,
} from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { OnboardingWrapper } from "./_components/onboarding-wrapper"
import { StepWelcome } from "./_components/step-welcome"
import { StepDeliverables } from "./_components/step-deliverables"
import { StepAgreement } from "./_components/step-agreement"
import { StepPayment } from "./_components/step-payment"
import { StepProfile } from "./_components/step-profile"
import type {
  Agreement,
  BankSettings,
  PaymentRequest,
  FormTemplate,
  FormResponse,
  ClientType,
} from "@/types"

export default async function OnboardingPage() {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const [projectRecord] = await db
    .select()
    .from(projects)
    .where(eq(projects.client_id, clientUser.client_id))

  if (!projectRecord) {
    return (
      <div className="portal-holding">
        <h1>No project found</h1>
        <p>Please contact the WebbHeads team to get your project set up.</p>
      </div>
    )
  }

  if (projectRecord.profile_submitted_at) {
    redirect("/portal/dashboard")
  }

  const [clientRecord] = projectRecord.client_id
    ? await db.select().from(clients).where(eq(clients.id, projectRecord.client_id))
    : [null]

  const project = {
    ...projectRecord,
    client: clientRecord ?? null,
  }

  let currentStep = 1

  if (!project.welcome_seen_at) {
    currentStep = 1
  } else {
    if (!project.deliverables_approved) {
      currentStep = 2

      return (
        <OnboardingWrapper currentStep={currentStep}>
          <StepDeliverables project={project as any} />
        </OnboardingWrapper>
      )
    }

    const [agreement] = await db
      .select()
      .from(agreements)
      .where(eq(agreements.project_id, project.id))

    const agreementComplete =
      agreement?.client_agreed === true && !!agreement?.signature_url

    if (!agreementComplete) {
      currentStep = 3

      return (
        <OnboardingWrapper currentStep={currentStep}>
          {agreement ? (
            <StepAgreement projectId={project.id} agreement={agreement as any} />
          ) : (
            <div className="info-banner">
              Your agreement is being prepared. Please check back shortly.
            </div>
          )}
        </OnboardingWrapper>
      )
    }

    let [advancePayment] = await db
      .select()
      .from(payment_requests)
      .where(
        and(
          eq(payment_requests.project_id, project.id),
          eq(payment_requests.request_type, "advance")
        )
      )

    if (!advancePayment) {
      const val = project.project_value ? Number(project.project_value) : 0
      const pct = project.advance_percent ? Number(project.advance_percent) : 50
      const amount = val > 0 ? (val * pct) / 100 : 0

      if (amount > 0) {
        const [newPayment] = await db
          .insert(payment_requests)
          .values({
            project_id: project.id,
            request_type: "advance",
            amount: String(amount),
            status: "pending_payment",
          })
          .returning()

        if (newPayment) {
          advancePayment = newPayment
        }
      }
    }

    const advanceApproved = advancePayment?.status === "approved"

    if (!advanceApproved) {
      currentStep = 4

      const [bankSettings] = await db
        .select()
        .from(bank_settings)
        .where(eq(bank_settings.id, 1))

      return (
        <OnboardingWrapper currentStep={currentStep}>
          <StepPayment
            projectId={project.id}
            project={{
              project_value: project.project_value ? Number(project.project_value) : null,
              advance_percent: project.advance_percent ? Number(project.advance_percent) : 50,
            }}
            bankSettings={(bankSettings as any) || null}
            paymentRequest={(advancePayment as any) || null}
          />
        </OnboardingWrapper>
      )
    }

    currentStep = 5

    const clientType = (project.client as { client_type?: ClientType })?.client_type ?? "both"

    const allTemplates = await db
      .select()
      .from(form_templates)
      .orderBy(asc(form_templates.sort_order))

    const templates = (allTemplates ?? []).filter((t) => {
      if (t.scope === "general") return true
      if (clientType === "both") return true
      return t.scope === clientType
    })

    const existingResponses = await db
      .select()
      .from(form_responses)
      .where(eq(form_responses.project_id, project.id))

    return (
      <OnboardingWrapper currentStep={currentStep}>
        <StepProfile
          projectId={project.id}
          templates={templates as any}
          existingResponses={(existingResponses ?? []) as any}
        />
      </OnboardingWrapper>
    )
  }

  return (
    <OnboardingWrapper currentStep={1}>
      <StepWelcome clientName={clientUser.full_name} projectId={project.id} />
    </OnboardingWrapper>
  )
}
