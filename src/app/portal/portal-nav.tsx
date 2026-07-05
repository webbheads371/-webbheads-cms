"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, CreditCard, LifeBuoy } from "lucide-react"

export function PortalNav() {
  const pathname = usePathname()

  const links = [
    { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/dashboard?tab=documents", label: "Documents", icon: FileText },
    { href: "/portal/dashboard?tab=payments", label: "Payments", icon: CreditCard },
    { href: "/portal/dashboard?tab=support", label: "Support", icon: LifeBuoy },
  ]

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href

        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group overflow-hidden ${
              isActive
                ? "text-primary dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110`} />
            <span>{link.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full" />
            )}
            <span className="absolute inset-0 bg-slate-100 dark:bg-slate-800 opacity-0 group-hover:opacity-100 rounded-lg -z-10 transition-opacity duration-300" />
          </Link>
        )
      })}
    </nav>
  )
}
