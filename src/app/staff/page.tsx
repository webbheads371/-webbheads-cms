import { createClient } from "@/lib/supabase/server"
import { getCurrentStaff } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StaffClient } from "./staff-client"

export default async function StaffPage() {
  const supabase = createClient()

  const currentStaff = await getCurrentStaff()

  if (currentStaff?.role !== "admin") {
    redirect("/dashboard")
  }

  const [
    { data: staff },
    { data: projects },
    { data: clients },
  ] = await Promise.all([
    supabase.from("staff").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, client_id").order("name"),
    supabase.from("clients").select("id, company_name").order("company_name"),
  ])

  return (
    <StaffClient
      staff={staff || []}
      projects={projects || []}
      clients={clients || []}
    />
  )
}
