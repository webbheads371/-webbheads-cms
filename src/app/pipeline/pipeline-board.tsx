"use client"

import { useState, useCallback, useMemo, memo } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { formatCurrency } from "@/lib/utils"
import { moveProjectStage } from "@/lib/actions/actions"
import type { Project, PipelineStage, Staff } from "@/types"

interface PipelineBoardProps {
  projects: Project[]
  stages: PipelineStage[]
  currentStaff: Staff | null
}

export function PipelineBoard({ projects, stages, currentStaff }: PipelineBoardProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showForceDialog, setShowForceDialog] = useState(false)
  const [pendingStage, setPendingStage] = useState<string | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const isAdmin = currentStaff?.role === "admin"
  const isSales = currentStaff?.role === "sales"

  const canDrag = useCallback(
    (project: Project) => {
      if (isAdmin) return true
      if (isSales) return true
      if (currentStaff?.id === project.tech_lead_id) return true
      if (currentStaff?.id === project.content_lead_id) return true
      return false
    },
    [isAdmin, isSales, currentStaff]
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const projectId = active.id as string
    const newStage = over.id as string

    const project = projects.find((p) => p.id === projectId)
    if (!project || project.current_stage === newStage) return

    if (isAdmin) {
      await moveProject(projectId, newStage)
    } else {
      setPendingStage(newStage)
      setSelectedProject(project)
      setShowForceDialog(true)
    }
  }

  async function moveProject(projectId: string, newStage: string) {
    await moveProjectStage(projectId, newStage)
    setShowForceDialog(false)
    router.refresh()
  }

  const { kanbanStages, terminalStages } = useMemo(
    () => ({
      kanbanStages: stages.filter((s) => !["closed_won", "closed_lost"].includes(s.key)),
      terminalStages: stages.filter((s) => ["closed_won", "closed_lost"].includes(s.key)),
    }),
    [stages]
  )

  const projectsByStage = useMemo(() => {
    const map = new Map<string, Project[]>()
    for (const p of projects) {
      const key = p.status === "active" ? p.current_stage : p.status
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return map
  }, [projects])

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag and drop projects between stages"
      />

      <DndContext
        sensors={sensors}
        onDragStart={(event: DragStartEvent) => {
          const project = projects.find((p) => p.id === event.active.id)
          if (project) setActiveProject(project)
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {kanbanStages.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                projects={projectsByStage.get(stage.key) || []}
                canDrag={canDrag}
              />
            ))}
            {terminalStages.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                projects={projectsByStage.get(stage.key) || []}
                canDrag={canDrag}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeProject && (
            <Card className="w-64 opacity-80">
              <CardContent className="p-4">
                <p className="font-medium text-sm">{activeProject.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeProject.client?.company_name}
                </p>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={showForceDialog} onOpenChange={setShowForceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move project anyway?</DialogTitle>
            <DialogDescription>
              Some required checklist items may be incomplete. Only admins can force-move
              projects without completing all required items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForceDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedProject && pendingStage) {
                  moveProject(selectedProject.id, pendingStage)
                }
              }}
            >
              Move anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const KanbanColumn = memo(function KanbanColumn({
  stage,
  projects,
  canDrag,
}: {
  stage: PipelineStage
  projects: Project[]
  canDrag: (project: Project) => boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key })
  return (
    <div
      ref={setNodeRef}
      className={`w-64 flex-shrink-0 ${isOver ? "ring-2 ring-primary rounded-lg" : ""}`}
    >
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm capitalize">{stage.label}</h3>
          <Badge variant="secondary" className="ml-2">
            {projects.length}
          </Badge>
        </div>
      </div>
      <div className="space-y-3 min-h-[200px]">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} canDrag={canDrag(project)} />
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            No projects
          </div>
        )}
      </div>
    </div>
  )
})

const ProjectCard = memo(function ProjectCard({ project, canDrag }: { project: Project; canDrag: boolean }) {
  const router = useRouter()
  const isTerminal = project.status === "closed_won" || project.status === "closed_lost"

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow ${!canDrag ? "opacity-75" : ""}`}
      >
        <CardContent className="p-4">
          <p className="font-medium text-sm truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {project.client?.company_name}
          </p>
          <div className="flex items-center justify-between mt-2">
            {project.project_value && (
              <span className="text-xs font-medium">
                {formatCurrency(project.project_value)}
              </span>
            )}
            {isTerminal && (
              <Badge
                variant={project.status === "closed_won" ? "default" : "destructive"}
                className="text-xs"
              >
                {project.status.replace("_", " ")}
              </Badge>
            )}
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {project.tech_lead && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Tech: {project.tech_lead.full_name?.split(" ")[0]}
              </Badge>
            )}
            {project.content_lead && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Content: {project.content_lead.full_name?.split(" ")[0]}
              </Badge>
            )}
            {project.sales_lead && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Sales: {project.sales_lead.full_name?.split(" ")[0]}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})
