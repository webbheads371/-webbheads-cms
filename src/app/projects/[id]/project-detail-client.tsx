"use client"

import { AlertTriangle, Trash2 } from "lucide-react"
import { useState, lazy, Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useSupabase } from "@/hooks/use-supabase"
import { StageStepper } from "./stage-stepper"
import type { Project, PipelineStage, ProjectChecklistItem, Payment, Document, ActivityLog, Staff, Agreement, PaymentRequest, FormResponse, ProjectStatusUpdate } from "@/types"

const ChecklistPanel = dynamic(() => import("./checklist-panel").then((m) => ({ default: m.ChecklistPanel })), { ssr: false })
const PaymentsTab = dynamic(() => import("./payments-tab").then((m) => ({ default: m.PaymentsTab })), { ssr: false })
const DocumentsTab = dynamic(() => import("./documents-tab").then((m) => ({ default: m.DocumentsTab })), { ssr: false })
const ActivityTimeline = dynamic(() => import("./activity-timeline").then((m) => ({ default: m.ActivityTimeline })), { ssr: false })
const AgreementTab = dynamic(() => import("./agreement-tab").then((m) => ({ default: m.AgreementTab })), { ssr: false })
const FormResponsesTab = dynamic(() => import("./form-responses-tab").then((m) => ({ default: m.FormResponsesTab })), { ssr: false })
const ClientPortalTab = dynamic(() => import("./client-portal-tab").then((m) => ({ default: m.ClientPortalTab })), { ssr: false })
const WorkUpdatesTab = dynamic(() => import("./work-updates-tab").then((m) => ({ default: m.WorkUpdatesTab })), { ssr: false })


interface Props {
  project: Project & { client: any; tech_lead: Staff | null; content_lead: Staff | null; sales_lead: Staff | null }
  stages: PipelineStage[]
  checklistItems: ProjectChecklistItem[]
  payments: Payment[]
  documents: Document[]
  activity: (ActivityLog & { actor: Staff | null })[]
  currentStaff: Staff | null
  // Phase 2
  agreement: Agreement | null
  paymentRequests: PaymentRequest[]
  formResponses: FormResponse[]
  statusUpdates: ProjectStatusUpdate[]
}

export function ProjectDetailClient({
  project, stages, checklistItems, payments, documents, activity, currentStaff,
  agreement, paymentRequests, formResponses, statusUpdates,
}: Props) {
  const [showForceDialog, setShowForceDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()
  const supabase = useSupabase()

  const isAdmin = currentStaff?.role === "admin"
  const currentStageIndex = stages.findIndex((s) => s.key === project.current_stage)
  const nextStage = stages[currentStageIndex + 1]
  const isTerminal = ["closed_won", "closed_lost"].includes(project.current_stage)

  const currentChecklist = checklistItems.filter((i) => i.stage_key === project.current_stage)
  const incompleteRequired = currentChecklist.filter((i) => i.is_required && !i.is_done)

  async function handleMoveStage() {
    if (!nextStage) return

    if (incompleteRequired.length > 0 && !isAdmin) {
      setShowForceDialog(true)
      return
    }

    await performMove()
  }

  async function performMove(forced = false) {
    if (!nextStage) return

    const newStatus = nextStage.key === "closed_won"
      ? "closed_won" : nextStage.key === "closed_lost"
      ? "closed_lost" : "active"

    const { error } = await supabase
      .from("projects")
      .update({ current_stage: nextStage.key, status: newStatus })
      .eq("id", project.id)
    if (error) return

    const { data: templates } = await supabase
      .from("checklist_templates")
      .select("*")
      .eq("stage_key", nextStage.key)

    if (templates) {
      const existingLabels = checklistItems.map((i) => i.label)
      const newItems = templates
        .filter((t) => !existingLabels.includes(t.label))
        .map((t) => ({
          project_id: project.id,
          template_id: t.id,
          stage_key: t.stage_key,
          label: t.label,
          category: t.category,
          is_required: t.is_required,
          is_done: false,
        }))
      if (newItems.length > 0) {
        await supabase.from("project_checklist_items").insert(newItems)
      }
    }

    await supabase.from("activity_log").insert({
      project_id: project.id,
      actor_id: currentStaff?.id,
      action: "stage_changed",
      detail: { from: project.current_stage, to: nextStage.key, forced },
    })

    setShowForceDialog(false)
    router.refresh()
  }

  async function handleCloseProject(outcome: "closed_won" | "closed_lost") {
    const { error } = await supabase
      .from("projects")
      .update({ current_stage: outcome, status: outcome })
      .eq("id", project.id)
    if (error) return

    await supabase.from("activity_log").insert({
      project_id: project.id,
      actor_id: currentStaff?.id,
      action: "stage_changed",
      detail: { from: project.current_stage, to: outcome, forced: incompleteRequired.length > 0, closed: true },
    })

    setShowCloseDialog(false)
    router.refresh()
  }

  async function handleDeleteProject() {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id)
    if (error) {
      console.error("Failed to delete project:", error)
      return
    }

    setShowDeleteDialog(false)
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={
          <div className="flex items-center gap-2 mt-1">
            <span>{project.client?.company_name}</span>
            <Badge variant="outline" className="capitalize">
              {project.current_stage.replace(/_/g, " ")}
            </Badge>
            {project.status !== "active" && (
              <Badge variant={project.status === "closed_won" ? "default" : "destructive"}>
                {project.status.replace("_", " ")}
              </Badge>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        {project.tech_lead && (
          <Badge variant="secondary">Tech Lead: {project.tech_lead.full_name}</Badge>
        )}
        {project.content_lead && (
          <Badge variant="secondary">Content Lead: {project.content_lead.full_name}</Badge>
        )}
        {project.sales_lead && (
          <Badge variant="secondary">Sales Lead: {project.sales_lead.full_name}</Badge>
        )}
        {project.project_value && (
          <Badge variant="secondary">Value: {formatCurrency(project.project_value)}</Badge>
        )}
        {project.expected_close_date && (
          <Badge variant="secondary">Expected: {formatDate(project.expected_close_date)}</Badge>
        )}
      </div>

      <StageStepper
        stages={stages}
        currentStage={project.current_stage}
        status={project.status}
      />

      {(isAdmin || !isTerminal) && (
        <div className="flex justify-end gap-3 mb-6">
          {!isTerminal && nextStage && nextStage.key !== "closed_won" && (
            <Dialog open={showForceDialog} onOpenChange={setShowForceDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleMoveStage} size="lg">
                  Move to {nextStage.label}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Incomplete required items</DialogTitle>
                  <DialogDescription>
                    {incompleteRequired.length} required checklist item(s) are not yet complete.
                    {isAdmin
                      ? " You can force-move as admin."
                      : " Ask an admin to force-move."}
                  </DialogDescription>
                </DialogHeader>
                {isAdmin && (
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowForceDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => performMove(true)}>Move anyway</Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          )}

          {!isTerminal && isAdmin && (
            <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
              <DialogTrigger asChild>
                <Button
                  variant={nextStage && nextStage.key === "closed_won" ? "default" : "outline"}
                  className={nextStage && nextStage.key === "closed_won" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-destructive text-destructive hover:bg-destructive/10"}
                  size="lg"
                >
                  Close Client & Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Client & Project</DialogTitle>
                  <DialogDescription>
                    Confirm the closure outcome of this project. Closing the client will transition this project to a terminal status (`Closed - Won` or `Closed - Lost`).
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  {incompleteRequired.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs rounded border border-amber-200 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Incomplete Items:</strong> There are {incompleteRequired.length} required checklist items not yet completed in the current stage ({project.current_stage.replace(/_/g, " ")}).
                        {!isAdmin && <p className="mt-1 font-semibold">Only admins can force-close with incomplete items.</p>}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCloseProject("closed_lost")}
                    disabled={incompleteRequired.length > 0 && !isAdmin}
                  >
                    Close as Lost
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleCloseProject("closed_won")}
                    disabled={incompleteRequired.length > 0 && !isAdmin}
                  >
                    Close as Won
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="lg">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Project</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this project? This action cannot be undone and will permanently remove all associated data, including checklist items, payments, documents, and activity logs.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteProject}>
                    Delete Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      <Tabs defaultValue="checklist" className="mt-6">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          {isAdmin ? (
            <>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="agreement">Agreement</TabsTrigger>
              <TabsTrigger value="form-responses">Form Responses</TabsTrigger>
              <TabsTrigger value="client-portal">Client Portal</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="work-updates">Work Updates</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="form-responses">Form Responses</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="checklist">
          <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading checklist...</div>}>
            <ChecklistPanel
              items={checklistItems}
              currentStage={project.current_stage}
              currentStaff={currentStaff}
              projectId={project.id}
              stages={stages}
              onAutoAdvance={() => performMove()}
            />
          </Suspense>
        </TabsContent>

        {isAdmin ? (
          <>
            <TabsContent value="payments">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading payments...</div>}>
                <PaymentsTab payments={payments} projectId={project.id} projectValue={project.project_value} />
              </Suspense>
            </TabsContent>

            <TabsContent value="documents">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading documents...</div>}>
                <DocumentsTab documents={documents} projectId={project.id} />
              </Suspense>
            </TabsContent>

            <TabsContent value="agreement">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading agreement...</div>}>
                <AgreementTab projectId={project.id} agreement={agreement} />
              </Suspense>
            </TabsContent>

            <TabsContent value="form-responses">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading responses...</div>}>
                <FormResponsesTab responses={formResponses} />
              </Suspense>
            </TabsContent>

            <TabsContent value="client-portal">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading portal controls...</div>}>
                <ClientPortalTab
                  project={project}
                  paymentRequests={paymentRequests}
                  statusUpdates={statusUpdates}
                  documents={documents}
                  agreement={agreement}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="activity">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading activity...</div>}>
                <ActivityTimeline activity={activity} />
              </Suspense>
            </TabsContent>
          </>
        ) : (
          <>
            <TabsContent value="work-updates">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading updates...</div>}>
                <WorkUpdatesTab projectId={project.id} statusUpdates={statusUpdates} />
              </Suspense>
            </TabsContent>

            <TabsContent value="documents">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading documents...</div>}>
                <DocumentsTab documents={documents} projectId={project.id} />
              </Suspense>
            </TabsContent>

            <TabsContent value="form-responses">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading responses...</div>}>
                <FormResponsesTab responses={formResponses} />
              </Suspense>
            </TabsContent>

            <TabsContent value="activity">
              <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading activity...</div>}>
                <ActivityTimeline activity={activity} />
              </Suspense>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
