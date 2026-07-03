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

  const totalPendingPayments = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <DashboardClient
      projects={projects || []}
      stages={stages || []}
      totalPendingPayments={totalPendingPayments}
    />
  )
}
