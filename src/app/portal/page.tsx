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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="p-5 bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 dark:from-cyan-500/20 dark:to-violet-500/20 rounded-3xl border border-cyan-500/20 dark:border-cyan-500/30 mb-6 shadow-inner animate-pulse">
          <svg className="h-10 w-10 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 3m0-3a2 2 0 110 3m-3 3.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Your project is being set up
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mt-3 text-base leading-relaxed">
          Our team is currently setting up your workspace. We will contact you once it is ready. Please check back shortly!
        </p>
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
