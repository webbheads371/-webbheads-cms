import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MessagesClient } from "./messages-client"
import { PageHeader } from "@/components/page-header"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch current staff role and profile
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!staff) {
    // If not staff, redirect to login or client portal
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-[32px] p-2 md:p-6 w-full">
      <PageHeader
        title="Messages"
        description="Manage client support inquiries and communication threads"
      />
      <MessagesClient currentStaff={staff} />
    </div>
  )
}
