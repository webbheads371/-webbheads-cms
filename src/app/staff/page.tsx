import { db } from "@/db"
import { staff, projects, clients } from "@/db/schema"
import { desc, asc } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StaffClient } from "./staff-client"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  const currentStaff = await getCurrentStaff()

  if (currentStaff?.role !== "admin") {
    redirect("/dashboard")
  }

  const [staffData, projectsData, clientsData] = await Promise.all([
    db.select().from(staff).orderBy(desc(staff.created_at)),
    db.select({ id: projects.id, name: projects.name, client_id: projects.client_id }).from(projects).orderBy(asc(projects.name)),
    db.select({ id: clients.id, company_name: clients.company_name }).from(clients).orderBy(asc(clients.company_name)),
  ])

  return (
    <StaffClient
      staff={staffData as any}
      projects={projectsData as any}
      clients={clientsData as any}
    />
  )
}
