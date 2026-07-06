import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import type { ReactNode } from "react"
import { PortalNav } from "./portal-nav"
import { PortalSidebar } from "./portal-sidebar"
import { PortalTabProvider } from "./portal-tab-context"
import { LogOut } from "lucide-react"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  return (
    <PortalTabProvider>
      <div className="portal-shell min-h-screen premium-bg font-sans relative overflow-x-hidden flex flex-col p-2 md:px-8 md:pt-4 md:pb-8">
        {/* Liquid Chrome Background Orbs */}
        <div className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="liquid-orb liquid-orb-1" />
          <div className="liquid-orb liquid-orb-2" />
          <div className="liquid-orb liquid-orb-3" />
          <div className="liquid-orb liquid-orb-4" />
          <div className="liquid-orb liquid-orb-5" />
          <div className="liquid-orb liquid-orb-6" />
        </div>

        {/* Outer Grid layout to manage floating navbar and content space */}
        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-0 items-start relative z-10 flex-1">
          {/* Top Navbar */}
          <PortalSidebar />

          {/* Bottom Floating Content Container */}
          <div className="w-full flex-1 flex flex-col min-w-0 pt-2 md:pt-4">
            {/* Main Content Body */}
            <main className="w-full flex-1 pb-28 md:pb-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </PortalTabProvider>
  )
}
