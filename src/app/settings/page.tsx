import { db } from "@/db"
import { pipeline_stages, checklist_templates } from "@/db/schema"
import { asc } from "drizzle-orm"
import { getCurrentStaff } from "@/lib/actions/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const currentStaff = await getCurrentStaff()

  if (currentStaff?.role !== "admin") {
    redirect("/dashboard")
  }

  const stagesData = await db
    .select()
    .from(pipeline_stages)
    .orderBy(asc(pipeline_stages.sort_order))

  const templatesData = await db
    .select()
    .from(checklist_templates)
    .orderBy(asc(checklist_templates.stage_key), asc(checklist_templates.sort_order))

  return <SettingsClient stages={stagesData as any} templates={templatesData as any} />
}
