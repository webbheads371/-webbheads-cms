"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Staff } from "@/types"
import {
  LayoutDashboard,
  Kanban,
  Users,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  Building2,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  adminOnly?: boolean
  children?: { href: string; label: string; icon: React.ElementType }[]
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/staff", label: "Staff", icon: UserCog, exact: true, adminOnly: true },
  { href: "/payments/queue", label: "Payment Queue", icon: CreditCard, adminOnly: true },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    exact: true,
    adminOnly: true,
    children: [
      { href: "/settings/bank", label: "Bank Settings", icon: Building2 },
      { href: "/settings/forms", label: "Form Builder", icon: FileText },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/settings"))

  // Load current staff to filter admin-only items
  useEffect(() => {
    async function loadStaff() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("staff").select("*").eq("id", user.id).single()
      if (data) setStaff(data)
    }
    loadStaff()
  }, [])

  // Keep settings section open when on a settings route
  useEffect(() => {
    if (pathname.startsWith("/settings")) {
      setSettingsOpen(true)
    }
  }, [pathname])

  const isAdmin = staff?.role === "admin"

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* Mobile menu toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 border border-slate-200/60 shadow-md backdrop-blur-sm text-slate-700 font-medium text-sm hover:bg-white transition-all duration-200"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">Menu</span>
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[280px] border-r bg-card/95 backdrop-blur-sm flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b flex items-center gap-3">
          <img src="/logo.png" alt="WebbHeads Logo" className="h-9 w-9 object-contain shadow-sm" />
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">WebbHeads</h1>
            <p className="text-xs text-muted-foreground mt-1">Staff Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Skip admin-only items for non-admin users (unless staff not loaded yet)
            if (item.adminOnly && staff && !isAdmin) return null

            const Icon = item.icon
            const active = isActive(item)

            if (item.children) {
              // Collapsible settings section
              const anyChildActive = item.children.some((c) => pathname === c.href)
              const sectionActive = active || anyChildActive

              return (
                <div key={item.href}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        sectionActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                    <button
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        sectionActive
                          ? "text-primary-foreground hover:bg-primary/80"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      aria-label="Toggle settings submenu"
                    >
                      {settingsOpen
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {settingsOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        const childActive = pathname === child.href
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                              childActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <ChildIcon className="h-3.5 w-3.5" />
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
