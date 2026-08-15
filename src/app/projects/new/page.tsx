import { db } from "@/db"
import { clients, staff } from "@/db/schema"
import { asc, inArray } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/supabase/server"
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

  const clientsData = await db
    .select({ id: clients.id, company_name: clients.company_name })
    .from(clients)
    .orderBy(asc(clients.company_name))

  const staffData = await db
    .select({ id: staff.id, full_name: staff.full_name, role: staff.role })
    .from(staff)
    .where(inArray(staff.role, ["tech_lead", "content_lead", "sales"]))

  if (!clientsData?.length) {
    redirect("/clients?noClients=true")
  }

  return (
    <NewProjectForm
      clients={clientsData}
      staff={staffData}
      preselectedClientId={searchParams.client_id}
    />
  )
}
