"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StaffChangePasswordDialog } from "@/components/staff-change-password-dialog"
import type { Staff } from "@/types"
import { useRouter } from "next/navigation"

export function TopBar() {
  const [staff, setStaff] = useState<Staff | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadStaff() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("staff").select("*").eq("id", user.id).single()
      if (data) setStaff(data)
    }
    loadStaff()
  }, [])

  const initials = staff?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 border-red-200",
    tech_lead: "bg-blue-100 text-blue-800 border-blue-200",
    content_lead: "bg-green-100 text-green-800 border-green-200",
    sales: "bg-amber-100 text-amber-800 border-amber-200",
  }

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 lg:px-8">
      <div />
      <div className="flex items-center gap-4">
        {staff && (
          <>
            <StaffChangePasswordDialog />
            <Badge variant="outline" className={roleColors[staff.role]}>
              {staff.role.replace("_", " ")}
            </Badge>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{staff.full_name}</span>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
