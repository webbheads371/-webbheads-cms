"use client"

import { useState, memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toggleChecklistItem } from "@/lib/supabase/actions"
import type { ProjectChecklistItem, Staff, PipelineStage } from "@/types"
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Sparkles, XCircle } from "lucide-react"

interface Props {
  items: ProjectChecklistItem[]
  currentStage: string
  currentStaff: Staff | null
  projectId: string
  stages: PipelineStage[]
  onAutoAdvance?: () => void
}

export function ChecklistPanel({
  items,
  currentStage,
  currentStaff,
  projectId,
  stages,
  onAutoAdvance,
}: Props) {
  const [optimisticItems, setOptimisticItems] = useState<ProjectChecklistItem[] | null>(null)
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set())
  const router = useRouter()

  const currentItems = optimisticItems ?? items

  const groupedItems = useMemo(() => {
    const map: Record<string, ProjectChecklistItem[]> = {}
    for (const stage of stages) {
      map[stage.key] = []
    }

    for (const item of currentItems) {
      if (!map[item.stage_key]) {
        map[item.stage_key] = []
      }
      map[item.stage_key].push(item)
    }

    for (const key in map) {
      map[key].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }

    return map
  }, [currentItems, stages])

  const currentStageIndex = stages.findIndex((s) => s.key === currentStage)

  const canEdit = useCallback(
    (item: ProjectChecklistItem) => {
      if (!currentStaff) return false
      if (currentStaff.role === "admin") return true

      const stageIndex = stages.findIndex((s) => s.key === item.stage_key)
      if (stageIndex > currentStageIndex && currentStageIndex !== -1) return false

      if (currentStaff.role === "sales" && item.stage_key === "deposit_verification") return true

      return false
    },
    [currentStaff, stages, currentStageIndex]
  )

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

    const res = await toggleChecklistItem(item.id, newDone)
    if (res.error) {
      setOptimisticItems(null)
      return
    }

    router.refresh()

    if (newDone && item.is_required && item.stage_key === currentStage) {
      const currentStageItems = groupedItems[currentStage] || []
      const requiredItems = currentStageItems.filter((i) => i.is_required)
      const doneRequiredItems = requiredItems.filter((i) => (i.id === item.id ? newDone : i.is_done))

      if (doneRequiredItems.length === requiredItems.length && requiredItems.length > 0) {
        if (onAutoAdvance) {
          onAutoAdvance()
        }
      }
    }
  }

  function toggleCollapse(stageKey: string) {
    setCollapsedStages((prev) => {
      const next = new Set(prev)
      if (next.has(stageKey)) next.delete(stageKey)
      else next.add(stageKey)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const stageItems = groupedItems[stage.key] || []
        if (stageItems.length === 0) return null

        const isCurrent = stage.key === currentStage
        const isCollapsed = collapsedStages.has(stage.key)
        const doneCount = stageItems.filter((i) => i.is_done).length
        const totalCount = stageItems.length
        const isFullyDone = doneCount === totalCount

        return (
          <Card
            key={stage.key}
            className={cn(
              "transition-all",
              isCurrent && "border-primary/50 ring-1 ring-primary/20"
            )}
          >
            <CardHeader
              className="p-4 cursor-pointer select-none"
              onClick={() => toggleCollapse(stage.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-sm font-medium capitalize">
                    {stage.label}
                  </CardTitle>
                  {isCurrent && (
                    <Badge variant="default" className="text-[10px]">
                      Active Stage
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {doneCount}/{totalCount}
                  </span>
                  {isFullyDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            </CardHeader>

            {!isCollapsed && (
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {stageItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    canEdit={canEdit(item)}
                    onToggle={() => handleToggle(item)}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

const ChecklistItemRow = memo(function ChecklistItemRow({
  item,
  canEdit,
  onToggle,
}: {
  item: ProjectChecklistItem
  canEdit: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors",
        !canEdit && "opacity-60 cursor-not-allowed"
      )}
    >
      <Checkbox
        id={item.id}
        checked={item.is_done}
        onCheckedChange={onToggle}
        disabled={!canEdit}
        className="mt-0.5"
      />
      <div className="flex-1 space-y-1">
        <label
          htmlFor={item.id}
          className={cn(
            "text-sm font-medium leading-none cursor-pointer",
            item.is_done && "line-through text-muted-foreground"
          )}
        >
          {item.label}
        </label>
        {item.is_required && (
          <Badge variant="outline" className="ml-2 text-[10px] text-amber-600 border-amber-300">
            Required
          </Badge>
        )}
      </div>
    </div>
  )
})
