"use client"

import { usePortalTab } from "@/app/portal/portal-tab-context"
import { KeyRound, LifeBuoy, LogOut } from "lucide-react"

export function MobileDashboardActions() {
  const { activeTab, setActiveTab } = usePortalTab()

  return (
    <div className="contents md:hidden">
      <button
        onClick={() => setActiveTab("credentials")}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-300 ${
          activeTab === "credentials" 
            ? "border-red-500/50 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
            : "border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900 text-muted-foreground hover:text-[#D6A33C] hover:bg-slate-50 dark:hover:bg-slate-800/60"
        }`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)' }}
      >
        <KeyRound className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Credentials</span>
      </button>

      <button
        onClick={() => setActiveTab("support")}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-300 ${
          activeTab === "support" 
            ? "border-red-500/50 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
            : "border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900 text-muted-foreground hover:text-[#D6A33C] hover:bg-slate-50 dark:hover:bg-slate-800/60"
        }`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)' }}
      >
        <LifeBuoy className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Support</span>
      </button>

      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-300"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)' }}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </form>
    </div>
  )
}
