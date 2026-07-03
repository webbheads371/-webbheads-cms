import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

export default async function PortalPage() {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const supabase = createClient()

  // Find client's project
  const { data: project } = await supabase
    .from("projects")
    .select("id, profile_submitted_at")
    .eq("client_id", clientUser.client_id)
    .single()

  if (!project) {
    // No project yet — show holding screen
    return (
      <div className="portal-holding">
        <h1>Your project is being set up</h1>
        <p>Our team will be in touch shortly. Please check back soon.</p>
      </div>
    )
  }

  // If Step 4 complete → go to dashboard; otherwise onboarding wizard
  if (project.profile_submitted_at) {
    redirect("/portal/dashboard")
  } else {
    redirect("/portal/onboarding")
  }
}
