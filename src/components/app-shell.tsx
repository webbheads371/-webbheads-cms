"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { TopBar } from "./topbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"
  const isPortal = pathname?.startsWith("/portal")

  if (isLogin || isPortal) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-[280px]">
        <TopBar />
        <main className="flex-1 p-4 pt-16 lg:pt-0 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
