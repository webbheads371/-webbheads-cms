"use client"

import { useState, memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/hooks/use-supabase"
import type { ProjectChecklistItem, Staff, PipelineStage } from "@/types"
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Sparkles, XCircle } from "lucide-react"

interface Props {
  items: ProjectChecklistItem[]
  currentStage: string
  currentStaff: Staff | null
  projectId: string
  stages: PipelineStage[]
}

const categoryColors: Record<string, string> = {
  tech: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50",
  content: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/50",
  sales: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50",
  general: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50",
}

export const ChecklistPanel = memo(function ChecklistPanel({ items, currentStage, currentStaff, projectId, stages }: Props) {
  const router = useRouter()
  const supabase = useSupabase()
  const [optimisticItems, setOptimisticItems] = useState<ProjectChecklistItem[] | null>(null)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  const displayItems = optimisticItems ?? items

  const activeStages = useMemo(() => {
    if (currentStage === "closed_lost") {
      return stages.filter((s) => s.key === "closed_lost")
    }
    return stages.filter((s) => !["closed_won", "closed_lost"].includes(s.key))
  }, [stages, currentStage])

  // Group items by stage
  const groupedItems = useMemo(() => {
    const groups: Record<string, ProjectChecklistItem[]> = {}
    activeStages.forEach((stage) => {
      groups[stage.key] = []
    })
    displayItems.forEach((item) => {
      if (groups[item.stage_key]) {
        groups[item.stage_key].push(item)
      }
    })
    return groups
  }, [displayItems, activeStages])

  // Track expanded stages
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(() => {
    return { [currentStage]: true }
  })

  const toggleStage = (stageKey: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageKey]: !prev[stageKey],
    }))
  }

  const canEdit = useCallback((item: ProjectChecklistItem) => {
    if (!currentStaff) return false
    if (["admin", "tech_lead", "content_lead"].includes(currentStaff.role)) return true
    if (currentStaff.role === "sales" && item.category === "sales") return true
    return false
  }, [currentStaff])

  async function handleToggle(item: ProjectChecklistItem) {
    if (!canEdit(item)) return

    const newDone = !item.is_done
    setOptimisticItems((prev) => {
      const base = prev ?? items
      return base.map((i) =>
        i.id === item.id
          ? {
              ...i,
              is_done: newDone,
              done_by: newDone ? currentStaff?.id ?? null : null,
              done_at: newDone ? new Date().toISOString() : null,
            }
          : i
      )
    })

    const { error } = await supabase
      .from("project_checklist_items")
      .update({
        is_done: newDone,
        done_by: newDone ? currentStaff?.id : null,
        done_at: newDone ? new Date().toISOString() : null,
      })
      .eq("id", item.id)

    if (error) {
      setOptimisticItems(null)
      return
    }

    await supabase.from("activity_log").insert({
      project_id: projectId,
      actor_id: currentStaff?.id,
      action: "checklist_ticked",
      detail: { item_id: item.id, label: item.label, is_done: newDone },
    })

    router.refresh()
  }

  const isAdmin = currentStaff?.role === "admin"
  const isTerminal = ["closed_won", "closed_lost"].includes(currentStage)
  
  // Calculate remaining incomplete required items for current stage
  const currentStageItems = groupedItems[currentStage] || []
  const incompleteRequired = currentStageItems.filter((i) => i.is_required && !i.is_done)

  async function handleCloseProject(outcome: "closed_won" | "closed_lost") {
    const { error } = await supabase
      .from("projects")
      .update({ current_stage: outcome, status: outcome })
      .eq("id", projectId)
    if (error) return

    await supabase.from("activity_log").insert({
      project_id: projectId,
      actor_id: currentStaff?.id,
      action: "stage_changed",
      detail: { from: currentStage, to: outcome, forced: incompleteRequired.length > 0, closed: true },
    })

    setShowCloseDialog(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {activeStages.map((stage, index) => {
        const stageItems = groupedItems[stage.key] || []
        const completedCount = stageItems.filter((i) => i.is_done).length
        const totalCount = stageItems.length
        const isCurrent = stage.key === currentStage
        const isExpanded = expandedStages[stage.key]

        return (
          <Card
            key={stage.key}
            className={cn(
              "transition-all duration-200 border",
              isCurrent && "ring-1 ring-primary border-primary bg-primary/[0.01]",
              !isCurrent && "bg-card hover:bg-muted/10"
            )}
          >
            <div
              onClick={() => toggleStage(stage.key)}
              className="flex items-center justify-between p-4 cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border",
                    isCurrent && "bg-primary border-primary text-primary-foreground",
                    !isCurrent && completedCount === totalCount && totalCount > 0
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-muted text-muted-foreground border-muted-foreground/20"
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                    {stage.label}
                    {isCurrent && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0.5 px-2">
                        Active Stage
                      </Badge>
                    )}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {completedCount}/{totalCount} Done
                </Badge>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {isExpanded && (
              <CardContent className="pt-0 border-t bg-muted/[0.02] dark:bg-transparent">
                <div className="space-y-2 mt-4">
                  {stageItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        item.is_done && "bg-muted/30 dark:bg-muted/10",
                        !canEdit(item) && "opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={item.is_done}
                        disabled={!canEdit(item)}
                        onCheckedChange={() => handleToggle(item)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              item.is_done && "line-through text-muted-foreground"
                            )}
                          >
                            {item.label}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColors[item.category])}>
                            {item.category}
                          </Badge>
                          {item.is_required && (
                            <span className="text-[10px] text-destructive font-medium">*required</span>
                          )}
                        </div>
                        {item.done_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed {new Date(item.done_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageItems.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No checklist items for this stage.
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Close Client Section */}
      {!isTerminal && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/10 dark:bg-amber-950/10 mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Sparkles className="h-5 w-5" />
              Close Client & Project
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Once you have finished the delivery stages or if you want to cancel the contract, you can close this client's project.
            </p>
          </CardHeader>
          <CardContent>
            <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Close Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Client & Project</DialogTitle>
                  <DialogDescription>
                    Choose how you would like to close this client's project. This will transition the project to a terminal status (`Closed - Won` or `Closed - Lost`).
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  {incompleteRequired.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs rounded border border-amber-200 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Incomplete Items:</strong> There are {incompleteRequired.length} required checklist items not yet completed in the current stage ({currentStage.replace(/_/g, " ")}).
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
          </CardContent>
        </Card>
      )}
    </div>
  )
})
