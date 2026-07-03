import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const { email, fullName, role } = await request.json()

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
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (invite?.user) {
    const { error: staffError } = await supabase.from("staff").insert({
      id: invite.user.id,
      full_name: fullName,
      email,
      role,
    })
    if (staffError) return NextResponse.json({ error: staffError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
