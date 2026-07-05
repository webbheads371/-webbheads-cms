import { redirect } from "next/navigation"
import { getCurrentClientUser } from "@/lib/supabase/server"
import type { ReactNode } from "react"
import { PortalNav } from "./portal-nav"
import { LogOut } from "lucide-react"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) redirect("/login")

  return (
    <div className="portal-shell bg-slate-50/30 dark:bg-slate-950 min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="portal-brand flex items-center gap-2">
              <img
                src="/logo.png"
                alt="WebbHeads Logo"
                className="h-9 w-9 rounded-xl object-contain bg-black p-1 hover:scale-105 transition-transform duration-300 shadow-md"
              />
              <span className="font-bold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-300">
                WebbHeads
              </span>
            </div>
            <PortalNav />
          </div>

          <div className="flex items-center gap-4">
            {/* Logout button */}
            <form action="/api/auth/signout" method="POST">
              <button 
                type="submit" 
                className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 hover:border-red-200 dark:border-slate-800 dark:hover:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 text-xs font-semibold shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
