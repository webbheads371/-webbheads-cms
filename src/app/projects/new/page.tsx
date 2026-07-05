import { createClient, getCurrentStaff } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NewProjectForm } from "./new-project-form"

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: { client_id?: string }
}) {
  const currentStaff = await getCurrentStaff()
  if (!currentStaff || currentStaff.role !== "admin") {
    redirect("/dashboard")
  }

  const supabase = createClient()

  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name")
    .order("company_name")

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .in("role", ["tech_lead", "content_lead", "sales"])

  if (!clients?.length) {
    redirect("/clients?noClients=true")
  }

  return (
    <NewProjectForm
      clients={clients}
      staff={staff || []}
      preselectedClientId={searchParams.client_id}
    />
  )
}
