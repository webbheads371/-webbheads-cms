"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"



export async function inviteStaff(email: string, fullName: string, role: string) {
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

  const { data: invite, error } = await supabase.auth.admin.inviteUserByEmail(email)
  if (error) return { error: error.message }

  if (invite?.user) {
    const { error: staffError } = await supabase.from("staff").insert({
      id: invite.user.id,
      full_name: fullName,
      email,
      role,
    })
    if (staffError) return { error: staffError.message }
  }

  revalidatePath("/staff")
  return { error: null }
}

export async function updateStaffRole(staffId: string, newRole: string) {
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

  const { error } = await supabase.from("staff").update({ role: newRole }).eq("id", staffId)
  if (error) return { error: error.message }
  revalidatePath("/staff")
  return { error: null }
}
