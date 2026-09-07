"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { getUnreadMessagesCount } from "@/lib/actions/message-actions"
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
  MessageSquare,
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
  { href: "/messages", label: "Messages", icon: MessageSquare },
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
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/settings"))

  // Poll for unread messages
  useEffect(() => {
    async function loadUnreadCount() {
      if (!session?.user) return
      try {
        const count = await getUnreadMessagesCount()
        setUnreadCount(count)
      } catch (err) {
        console.error("Failed to load unread count", err)
      }
    }
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 15000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    if (pathname.startsWith("/settings")) {
      setSettingsOpen(true)
    }
  }, [pathname])

  const isAdmin = session?.user?.role === "admin"

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <>
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
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="/logo.png" alt="WebbHeads Logo" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">WebbHeads</h1>
            <p className="text-xs text-muted-foreground mt-1">Staff Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && session?.user && !isAdmin) return null

            const Icon = item.icon
            const active = isActive(item)

            if (item.children) {
              const anyChildActive = item.children.some((c) => pathname === c.href)
              const sectionActive = active || anyChildActive

              return (
                <div key={item.href}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      prefetch={true}
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
                      {settingsOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
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
                            prefetch={true}
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
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-4 w-4" />
                  {item.href === "/messages" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                  )}
                </div>
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
