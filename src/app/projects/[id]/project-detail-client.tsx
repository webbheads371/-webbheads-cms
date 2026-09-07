"use client"

import { AlertTriangle, Trash2, ArrowLeft } from "lucide-react"
import { useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { formatCurrency, formatDate } from "@/lib/utils"
import { moveProjectStage } from "@/lib/actions/actions"
import { StageStepper } from "./stage-stepper"
import type {
  Project,
  PipelineStage,
  ProjectChecklistItem,
  Payment,
  Document,
  ActivityLog,
  Staff,
  Agreement,
  PaymentRequest,
  FormResponse,
  ProjectStatusUpdate,
  ContentSchedule,
} from "@/types"

const ChecklistPanel = dynamic(
  () => import("./checklist-panel").then((m) => ({ default: m.ChecklistPanel })),
  { ssr: false }
)
const PaymentsTab = dynamic(
  () => import("./payments-tab").then((m) => ({ default: m.PaymentsTab })),
  { ssr: false }
)
const DocumentsTab = dynamic(
  () => import("./documents-tab").then((m) => ({ default: m.DocumentsTab })),
  { ssr: false }
)
const ActivityTimeline = dynamic(
  () => import("./activity-timeline").then((m) => ({ default: m.ActivityTimeline })),
  { ssr: false }
)
const AgreementTab = dynamic(
  () => import("./agreement-tab").then((m) => ({ default: m.AgreementTab })),
  { ssr: false }
)
const FormResponsesTab = dynamic(
  () => import("./form-responses-tab").then((m) => ({ default: m.FormResponsesTab })),
  { ssr: false }
)
const ClientPortalTab = dynamic(
  () => import("./client-portal-tab").then((m) => ({ default: m.ClientPortalTab })),
  { ssr: false }
)
const WorkUpdatesTab = dynamic(
  () => import("./work-updates-tab").then((m) => ({ default: m.WorkUpdatesTab })),
  { ssr: false }
)
const ContentScheduleTabAdmin = dynamic(
  () => import("./content-schedule-tab").then((m) => ({ default: m.ContentScheduleTab })),
  { ssr: false }
)
const EditDetailsTab = dynamic(
  () => import("./edit-details-tab").then((m) => ({ default: m.EditDetailsTab })),
  { ssr: false }
)
const DeliverablesTab = dynamic(
  () => import("./deliverables-tab").then((m) => ({ default: m.DeliverablesTab })),
  { ssr: false }
)

interface Props {
  project: Project & {
    client: any
    tech_lead: Staff | null
    content_lead: Staff | null
    sales_lead: Staff | null
  }
  stages: PipelineStage[]
  checklistItems: ProjectChecklistItem[]
  payments: Payment[]
  documents: Document[]
  activity: (ActivityLog & { actor: Staff | null })[]
  currentStaff: Staff | null
  agreement: Agreement | null
  paymentRequests: PaymentRequest[]
  formResponses: FormResponse[]
  statusUpdates: ProjectStatusUpdate[]
  contentSchedule: ContentSchedule[]
  staffList: Staff[]
}

export function ProjectDetailClient({
  project,
  stages,
  checklistItems,
  payments,
  documents,
  activity,
  currentStaff,
  agreement,
  paymentRequests,
  formResponses,
  statusUpdates,
  contentSchedule,
  staffList,
}: Props) {
  const [showForceDialog, setShowForceDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  const isAdmin = currentStaff?.role === "admin"
  const currentStageIndex = stages.findIndex((s) => s.key === project.current_stage)
  const nextStage = stages[currentStageIndex + 1]
  const isTerminal = ["closed_won", "closed_lost"].includes(project.current_stage)

  const currentChecklist = checklistItems.filter(
    (i) => i.stage_key === project.current_stage
  )
  const incompleteRequired = currentChecklist.filter(
    (i) => i.is_required && !i.is_done
  )

  async function handleAdvanceStage() {
    if (!nextStage) return

    if (incompleteRequired.length > 0 && !isAdmin) {
      setShowForceDialog(true)
      return
    }

    await performMove()
  }

  async function performMove() {
    if (!nextStage) return
    await moveProjectStage(project.id, nextStage.key)
    setShowForceDialog(false)
    router.refresh()
  }

  async function handleCloseProject(outcome: "closed_won" | "closed_lost") {
    await moveProjectStage(project.id, outcome)
    setShowCloseDialog(false)
    router.refresh()
  }

  async function handleDeleteProject() {
    const res = await fetch(`/api/clients/${project.client_id}`, { method: "DELETE" })
    if (res.ok) {
      setShowDeleteDialog(false)
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <span>{project.client?.company_name}</span>
              <span>•</span>
              <span className="capitalize">{project.current_stage.replace("_", " ")}</span>
            </div>
          </div>
        }
      >
        <div className="flex gap-2">
          {!isTerminal && nextStage && (
            <Button onClick={handleAdvanceStage}>
              Move to: {nextStage.label}
            </Button>
          )}
          {!isTerminal && (
            <Button variant="outline" onClick={() => setShowCloseDialog(true)}>
              Close Project
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="mb-6">
        <StageStepper stages={stages} currentStage={project.current_stage} status={project.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Tech: {project.tech_lead?.full_name || "—"}</p>
            <p>Content: {project.content_lead?.full_name || "—"}</p>
            <p>Sales: {project.sales_lead?.full_name || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Financials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Value: {project.project_value ? formatCurrency(project.project_value) : "Not Set"}
            </p>
            <p>Advance: {project.advance_percent ?? 50}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{project.client?.contact_name || "No contact name"}</p>
            <p>{project.client?.email || "No email"}</p>
            <p>{project.client?.phone || "No phone"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="agreement">Agreement</TabsTrigger>
          <TabsTrigger value="payments">Payments & Requests</TabsTrigger>
          <TabsTrigger value="updates">Work Updates</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="content_schedule">Content Schedule</TabsTrigger>
          <TabsTrigger value="forms">Client Form</TabsTrigger>
          <TabsTrigger value="portal">Client Portal Link</TabsTrigger>
          {isAdmin && <TabsTrigger value="edit_details">Edit Details</TabsTrigger>}
        </TabsList>

        <TabsContent value="checklist">
          <ChecklistPanel
            items={checklistItems}
            currentStage={project.current_stage}
            currentStaff={currentStaff}
            projectId={project.id}
            stages={stages}
            onAutoAdvance={handleAdvanceStage}
          />
        </TabsContent>

        <TabsContent value="deliverables">
          <DeliverablesTab project={project} />
        </TabsContent>

        <TabsContent value="agreement">
          <AgreementTab agreement={agreement} projectId={project.id} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab
            payments={payments}
            projectId={project.id}
            projectValue={project.project_value}
          />
        </TabsContent>

        <TabsContent value="updates">
          <WorkUpdatesTab statusUpdates={statusUpdates as any} projectId={project.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab documents={documents} projectId={project.id} />
        </TabsContent>

        <TabsContent value="timeline">
          <ActivityTimeline activity={activity} />
        </TabsContent>

        <TabsContent value="content_schedule">
          <ContentScheduleTabAdmin items={contentSchedule} projectId={project.id} />
        </TabsContent>

        <TabsContent value="forms">
          <FormResponsesTab responses={formResponses as any} />
        </TabsContent>

        <TabsContent value="portal">
          <ClientPortalTab
            project={project}
            paymentRequests={paymentRequests as any}
            statusUpdates={statusUpdates as any}
            documents={documents as any}
            agreement={agreement as any}
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="edit_details">
            <EditDetailsTab project={project} staffList={staffList} />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showForceDialog} onOpenChange={setShowForceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Required items incomplete
            </DialogTitle>
            <DialogDescription>
              This stage has {incompleteRequired.length} incomplete required checklist item(s).
              As an admin, you can force-move the project to the next stage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => performMove()}>Move anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Project</DialogTitle>
            <DialogDescription>Select the final status for this project.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleCloseProject("closed_lost")}>
              Closed Lost
            </Button>
            <Button onClick={() => handleCloseProject("closed_won")}>Closed Won</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Project & Client
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{project.name}</strong>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
