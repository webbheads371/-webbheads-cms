import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { PipelineBoardLoader } from "./pipeline-board-loader"

export default async function PipelinePage() {
  const supabase = createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select("*, client:clients(company_name), tech_lead:staff!projects_tech_lead_id_fkey(id, full_name), content_lead:staff!projects_content_lead_id_fkey(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(100)

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("sort_order")

  const user = await supabase.auth.getUser()
  const { data: currentStaff } = await supabase
    .from("staff")
    .select("*")
    .eq("id", user.data.user?.id)
    .single()

  return (
    <Suspense fallback={<PipelineFallback />}>
      <PipelineBoardLoader
        projects={projects || []}
        stages={stages || []}
        currentStaff={currentStaff}
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
