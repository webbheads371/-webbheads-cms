"use client"

import { usePortalTab } from "./portal-tab-context"
import { Home, KeyRound, FileText, CreditCard, LifeBuoy, LogOut } from "lucide-react"

export function PortalSidebar() {
  const { activeTab, setActiveTab } = usePortalTab()

  const items = [
    { tabName: "home" as const, icon: Home, label: "Home" },
    { tabName: "credentials" as const, icon: KeyRound, label: "Credentials" },
    { tabName: "documents" as const, icon: FileText, label: "Documents" },
    { tabName: "payments" as const, icon: CreditCard, label: "Payments" },
    { tabName: "support" as const, icon: LifeBuoy, label: "Support" },
  ]

  return (
    <>
      {/* ── Desktop/Tablet top navbar (md and above) ── */}
      <div className="hidden md:flex flex-row items-center justify-between px-4 lg:px-6 py-2 h-[68px] w-full bg-transparent shrink-0 sticky top-0 z-50">
        {/* Logo + Nav Links */}
        <div className="flex flex-row gap-1 lg:gap-4 items-center">
          <div className="portal-brand flex items-center justify-center mr-2">
            <img
              src="/logo.png"
              alt="WebbHeads Logo"
              className="h-9 w-9 rounded-full object-contain hover:scale-110 transition-transform duration-300"
            />
          </div>
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.tabName
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.tabName)}
                className={`relative flex items-center justify-center h-11 px-4 gap-2 rounded-[14px] transition-all duration-300 group ${
                  isActive
                    ? "text-red-600 dark:text-red-500 bg-transparent scale-105"
                    : "text-black hover:text-slate-700 dark:text-slate-300 dark:hover:text-white hover:bg-white/10"
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-gradient-to-r from-red-500 to-red-700 rounded-t-md shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Logout */}
        <form action="/api/auth/signout" method="POST" className="flex justify-center">
          <button
            type="submit"
            className="flex items-center justify-center h-11 px-4 gap-2 rounded-[14px] text-black dark:text-slate-300 hover:text-red-600 hover:bg-red-50/60 dark:hover:bg-red-950/40 transition-all duration-300 group"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-wide">Sign out</span>
          </button>
        </form>
      </div>

      {/* ── Mobile bottom tab bar (below md) ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 px-2 pb-2">
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "0 -4px 24px rgba(60,50,20,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          <div className="flex items-center justify-around px-1 py-1">
            {items.filter(i => !["credentials", "support"].includes(i.tabName)).map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.tabName
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.tabName)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 h-14 flex-1 rounded-xl transition-all duration-200 ${
                    isActive ? "text-red-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={item.label}
                >
                  {isActive && (
                    <span className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-red-400 to-red-600 rounded-b-md" />
                  )}
                  <Icon className={`h-5 w-5 transition-all duration-200 ${isActive ? "scale-105" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-red-600" : "text-slate-500"}`}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
