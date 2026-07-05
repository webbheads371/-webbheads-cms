"use client"

import Link from "next/link"
import { usePortalTab } from "./portal-tab-context"
import { Home, KeyRound, FileText, CreditCard, LifeBuoy } from "lucide-react"

export function PortalNav() {
  const { activeTab, setActiveTab } = usePortalTab()

  const links = [
    { href: "/portal/dashboard", tabName: "home" as const, label: "Home", icon: Home },
    { href: "/portal/dashboard?tab=credentials", tabName: "credentials" as const, label: "Credentials", icon: KeyRound },
    { href: "/portal/dashboard?tab=documents", tabName: "documents" as const, label: "Documents", icon: FileText },
    { href: "/portal/dashboard?tab=payments", tabName: "payments" as const, label: "Payments", icon: CreditCard },
    { href: "/portal/dashboard?tab=support", tabName: "support" as const, label: "Support", icon: LifeBuoy },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 lg:gap-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = activeTab === link.tabName

          return (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                setActiveTab(link.tabName)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? "text-primary dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>{link.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full" />
              )}
              <span className="absolute inset-0 bg-slate-100/80 dark:bg-slate-800/80 opacity-0 scale-95 group-hover:scale-100 group-hover:opacity-100 rounded-lg -z-10 transition-all duration-300 ease-out" />
            </Link>
          )
        })}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-around h-16 md:hidden px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = activeTab === link.tabName

          return (
            <Link
              key={`mobile-${link.label}`}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                setActiveTab(link.tabName)
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-xl text-[10px] font-bold tracking-tight transition-all duration-300 ${
                isActive
                  ? "text-indigo-600 dark:text-white scale-105"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-500' : ''}`} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
