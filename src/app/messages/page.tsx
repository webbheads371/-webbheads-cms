import { redirect } from "next/navigation"
import { getCurrentStaff } from "@/lib/supabase/server"
import { MessagesClient } from "./messages-client"
import { PageHeader } from "@/components/page-header"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const staff = await getCurrentStaff()

  if (!staff) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-[32px] p-2 md:p-6 w-full">
      <PageHeader
        title="Messages"
        description="Manage client support inquiries and communication threads"
      />
      <MessagesClient currentStaff={staff as any} />
    </div>
  )
}
