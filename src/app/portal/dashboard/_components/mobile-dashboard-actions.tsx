"use client"

import { useState, useRef, useEffect } from "react"
import { usePortalTab } from "@/app/portal/portal-tab-context"
import { KeyRound, LifeBuoy, LogOut, Menu, X } from "lucide-react"
import { signOut } from "next-auth/react"
import { ChangePasswordForm } from "./change-password-form"

export function MobileDashboardActions() {
  const { activeTab, setActiveTab } = usePortalTab()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="flex md:hidden relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {menuOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-2 z-50 flex flex-col gap-1"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={() => {
              setActiveTab("credentials")
              setMenuOpen(false)
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              activeTab === "credentials" 
                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span className="text-sm font-medium">Credentials</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("support")
              setMenuOpen(false)
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              activeTab === "support" 
                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            <span className="text-sm font-medium">Support</span>
          </button>

          <div className="w-full">
            <ChangePasswordForm variant="dropdown" />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
