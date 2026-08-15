import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { db } from "@/db"
import { projects, clients } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { ReactNode } from "react"
import { PortalSidebar } from "./portal-sidebar"
import { PortalTabProvider } from "./portal-tab-context"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const [row] = await db
    .select({ client_type: clients.client_type })
    .from(projects)
    .leftJoin(clients, eq(projects.client_id, clients.id))
    .where(eq(projects.client_id, clientUser.client_id))

  const clientType = row?.client_type ?? "tech"
  const showSchedule = clientType === "content" || clientType === "both"

  return (
    <PortalTabProvider>
      <div className="portal-shell min-h-screen premium-bg font-sans relative overflow-x-hidden flex flex-col p-2 sm:p-3 md:px-8 md:pt-4 md:pb-8">
        <div className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="liquid-orb liquid-orb-1" />
          <div className="liquid-orb liquid-orb-2" />
          <div className="liquid-orb liquid-orb-3" />
          <div className="liquid-orb liquid-orb-4" />
          <div className="liquid-orb liquid-orb-5" />
          <div className="liquid-orb liquid-orb-6" />
        </div>

        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-0 items-start relative z-10 flex-1">
          <PortalSidebar showSchedule={showSchedule} />

          <div className="w-full flex-1 flex flex-col min-w-0 pt-1 md:pt-4">
            <main className="w-full flex-1 pb-24 md:pb-8" style={{ paddingBottom: 'max(96px, calc(80px + env(safe-area-inset-bottom)))' }}>
              <div className="md:!pb-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </PortalTabProvider>
  )
}
