import { Suspense } from "react"
import { db } from "@/db"
import { projects, pipeline_stages, clients } from "@/db/schema"
import { asc, desc, eq } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/actions/server"
import { PipelineBoardLoader } from "./pipeline-board-loader"

export default async function PipelinePage() {
  const currentStaff = await getCurrentStaff()

  const allProjectsRaw = await db
    .select({
      project: projects,
      client: { company_name: clients.company_name },
    })
    .from(projects)
    .leftJoin(clients, eq(projects.client_id, clients.id))
    .orderBy(desc(projects.created_at))
    .limit(100)

  const projectsData = allProjectsRaw.map((row) => ({
    ...row.project,
    client: row.client ?? null,
  }))

  const stagesData = await db
    .select()
    .from(pipeline_stages)
    .orderBy(asc(pipeline_stages.sort_order))

  return (
    <Suspense fallback={<PipelineFallback />}>
      <PipelineBoardLoader
        projects={projectsData as any}
        stages={stagesData}
        currentStaff={currentStaff as any}
      />
    </Suspense>
  )
}

function PipelineFallback() {
  return (
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
  )
}
