import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const { email, fullName, role, password, projectIds, clientIds } = await request.json()

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  // Create user directly using auth admin API with password and auto-confirm email
  const { data: invite, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (invite?.user) {
    const newStaffId = invite.user.id

    // Insert staff record
    const { error: staffError } = await supabase.from("staff").insert({
      id: newStaffId,
      full_name: fullName,
      email,
      role,
    })
    
    if (staffError) return NextResponse.json({ error: staffError.message }, { status: 400 })

    // Process Project Assignments
    const allProjectIdsToAssign = new Set<string>(projectIds || [])

    // If clientIds are selected, also assign to all projects of those clients
    if (clientIds && clientIds.length > 0) {
      const { data: clientProjects } = await supabase
        .from("projects")
        .select("id")
        .in("client_id", clientIds)
      
      if (clientProjects) {
        clientProjects.forEach((p) => allProjectIdsToAssign.add(p.id))
      }
    }

    const projectIdsArray = Array.from(allProjectIdsToAssign)
    if (projectIdsArray.length > 0) {
      if (role === "tech_lead") {
        await supabase
          .from("projects")
          .update({ tech_lead_id: newStaffId })
          .in("id", projectIdsArray)
      } else if (role === "content_lead") {
        await supabase
          .from("projects")
          .update({ content_lead_id: newStaffId })
          .in("id", projectIdsArray)
      }

      // Insert log entries
      const logs = projectIdsArray.map((projectId) => ({
        project_id: projectId,
        action: "staff_assigned",
        detail: { staff_id: newStaffId, role },
      }))
      await supabase.from("activity_log").insert(logs)
    }
  }

  return NextResponse.json({ ok: true })
}
