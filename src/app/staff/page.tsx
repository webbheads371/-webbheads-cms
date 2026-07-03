import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StaffClient } from "./staff-client"

export default async function StaffPage() {
  const supabase = createClient()

  const { data: currentStaff } = await supabase
    .from("staff")
    .select("*")
    .single()

  if (currentStaff?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .order("created_at", { ascending: false })

  return <StaffClient staff={staff || []} />
}
