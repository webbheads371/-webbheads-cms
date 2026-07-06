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
      {/* Desktop Navigation - Silver Glassmorphism */}
      <nav className="hidden md:flex items-center gap-1 lg:gap-2 p-1 rounded-2xl bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-sm">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? "text-[#D6A33C] dark:text-[#E8C56B] bg-white/60 dark:bg-white/10 shadow-sm backdrop-blur-sm"
                  : "text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
              <span>{link.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#E8C56B] to-[#D6A33C] rounded-full animate-fade-in shadow-[0_0_6px_rgba(214,163,60,0.3)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Mobile Bottom Navigation - Silver Frosted Glass */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/30 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl flex items-center justify-around h-16 md:hidden px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
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
                  ? "text-[#D6A33C] dark:text-[#E8C56B] scale-105"
                  : "text-[#6B7280] hover:text-[#111827] dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              <div className={`rounded-xl p-1.5 transition-all duration-300 ${isActive ? 'bg-white/60 dark:bg-white/10 shadow-sm' : ''}`}>
                <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110 text-[#D6A33C]' : ''}`} />
              </div>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
