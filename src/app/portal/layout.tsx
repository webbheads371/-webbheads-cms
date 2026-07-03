import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import type { ReactNode } from "react"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-brand">
            <span className="portal-brand-icon">W</span>
            <span className="portal-brand-name">WebbHeads</span>
          </div>
          <div className="portal-header-right">
            <span className="portal-user-name">
              Welcome, {clientUser.full_name}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="portal-logout-btn">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="portal-main">
        {children}
      </main>
    </div>
  )
}
