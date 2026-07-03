"use client"

import { useState, memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/hooks/use-supabase"
import type { ProjectChecklistItem, Staff } from "@/types"

interface Props {
  items: ProjectChecklistItem[]
  currentStage: string
  currentStaff: Staff | null
  projectId: string
}

const categoryColors: Record<string, string> = {
  tech: "bg-blue-100 text-blue-800 border-blue-200",
  content: "bg-green-100 text-green-800 border-green-200",
  sales: "bg-amber-100 text-amber-800 border-amber-200",
  general: "bg-purple-100 text-purple-800 border-purple-200",
}

export const ChecklistPanel = memo(function ChecklistPanel({ items, currentStage, currentStaff, projectId }: Props) {
  const router = useRouter()
  const supabase = useSupabase()
  const [optimisticItems, setOptimisticItems] = useState<ProjectChecklistItem[] | null>(null)

  const displayItems = optimisticItems ?? items

  const { currentItems, otherItems } = useMemo(() => ({
    currentItems: displayItems.filter((i) => i.stage_key === currentStage),
    otherItems: displayItems.filter((i) => i.stage_key !== currentStage && i.is_done),
  }), [displayItems, currentStage])

  const canEdit = useCallback((item: ProjectChecklistItem) => {
    if (!currentStaff) return false
    if (currentStaff.role === "admin") return true
    if (currentStaff.role === "sales" && item.category === "sales") return true
    if (currentStaff.role === "tech_lead" && ["tech", "general"].includes(item.category)) return true
    if (currentStaff.role === "content_lead" && ["content", "general"].includes(item.category)) return true
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
      action: "checklist_ticked",
      detail: { item_id: item.id, label: item.label, is_done: newDone },
    })
  }

  if (currentItems.length === 0 && otherItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No checklist items for this stage.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Current Stage Checklist
            <Badge variant="secondary" className="ml-2">
              {currentItems.filter((i) => i.is_done).length}/{currentItems.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  item.is_done && "bg-muted/30",
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
                  <div className="flex items-center gap-2 mb-1">
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
            {currentItems.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No items for this stage
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {otherItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed Checklist (other stages)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20">
                  <Checkbox checked disabled className="mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground line-through">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.stage_key.replace(/_/g, " ")})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})
