import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = createClient()

  const { data: currentStaff } = await supabase
    .from("staff")
    .select("*")
    .single()

  if (currentStaff?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("sort_order")

  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("*")
    .order("stage_key")
    .order("sort_order")

  return <SettingsClient stages={stages || []} templates={templates || []} />
}
