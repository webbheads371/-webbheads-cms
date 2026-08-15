"use client"

import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StaffChangePasswordDialog } from "@/components/staff-change-password-dialog"

export function TopBar() {
  const { data: session } = useSession()

  const userName = session?.user?.name || "User"
  const userRole = session?.user?.role || "staff"

  const initials = userName
    .split(" ")
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
      {/* Logo — visible on mobile; sidebar shows it on desktop */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="WebbHeads Logo" className="h-6 w-6 object-contain" />
        </div>
        <span className="text-sm font-bold tracking-tight">WebbHeads</span>
      </div>
      {/* Spacer on desktop so right-side content stays right-aligned */}
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            <StaffChangePasswordDialog />
            <Badge variant="outline" className={roleColors[userRole] || "bg-slate-100 text-slate-800"}>
              {userRole.replace("_", " ")}
            </Badge>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{userName}</span>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
