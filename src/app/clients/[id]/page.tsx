import { createClient, getCurrentStaff } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ClientDetailClient } from "./client-detail-client"

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const staff = await getCurrentStaff()
  const role = staff?.role || "sales"

  const { data: client } = await supabase
    .from("clients")
    .select("*, client_users(*)")
    .eq("id", params.id)
    .single()

  if (!client) notFound()

  const { data: projects } = await supabase
    .from("projects")
    .select("*, tech_lead:staff!projects_tech_lead_id_fkey(id, full_name), content_lead:staff!projects_content_lead_id_fkey(id, full_name), sales_lead:staff!projects_sales_lead_id_fkey(id, full_name)")
    .eq("client_id", params.id)
    .order("created_at", { ascending: false })

  return <ClientDetailClient client={client} projects={projects || []} role={role} />
}
