"use client"

import dynamic from "next/dynamic"
import { PageHeader } from "@/components/page-header"
import type { Project, PipelineStage, Staff } from "@/types"

const PipelineBoard = dynamic(() => import("./pipeline-board").then((m) => ({ default: m.PipelineBoard })), {
  ssr: false,
  loading: () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-64 flex-shrink-0 animate-pulse">
          <div className="h-5 w-24 bg-muted rounded mb-3" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-xl border bg-card p-4">
                <div className="h-4 w-40 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded mb-2" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
})

interface Props {
  projects: Project[]
  stages: PipelineStage[]
  currentStaff: Staff | null
}

export function PipelineBoardLoader({ projects, stages, currentStaff }: Props) {
  return <PipelineBoard projects={projects} stages={stages} currentStaff={currentStaff} />
}
