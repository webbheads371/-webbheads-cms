import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select("*, client:clients(*)")
    .limit(50)

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("sort_order")

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")

  const totalProjectValue = (projects || []).reduce((sum, p) => sum + (Number(p.project_value) || 0), 0)
  const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPendingPayments = Math.max(0, totalProjectValue - totalPaid)

  return (
    <DashboardClient
      projects={projects || []}
      stages={stages || []}
      totalPendingPayments={totalPendingPayments}
    />
  )
}
