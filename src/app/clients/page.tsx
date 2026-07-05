import { createClient, getCurrentStaff } from "@/lib/supabase/server"
import { ClientsClient } from "./clients-client"

export const dynamic = "force-dynamic"

export default async function ClientsPage() {
  const supabase = createClient()
  const staff = await getCurrentStaff()
  const role = staff?.role || "sales"

  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(count)")
    .order("created_at", { ascending: false })
    .limit(100)

  return <ClientsClient clients={clients || []} role={role} />
}
