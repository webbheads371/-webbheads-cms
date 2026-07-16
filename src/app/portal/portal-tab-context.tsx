"use client"

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from "react"
import { useSearchParams } from "next/navigation"

type TabType = "home" | "credentials" | "documents" | "payments" | "support" | "schedule"

interface PortalTabContextProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const PortalTabContext = createContext<PortalTabContextProps | undefined>(undefined)

const VALID_TABS: TabType[] = ["home", "credentials", "documents", "payments", "support", "schedule"]

function PortalTabContextInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as TabType | null
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "home"
  const [activeTab, setActiveTabState] = useState<TabType>(initialTab)

  useEffect(() => {
    const tab = searchParams.get("tab") as TabType
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTabState(tab)
    } else if (!tab) {
      setActiveTabState("home")
    }
  }, [searchParams])

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab)
    const newUrl = tab === "home" ? "/portal/dashboard" : `/portal/dashboard?tab=${tab}`
    window.history.pushState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl)
  }

  return (
    <PortalTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </PortalTabContext.Provider>
  )
}

export function PortalTabProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PortalTabContextInner>{children}</PortalTabContextInner>
    </Suspense>
  )
}

export function usePortalTab() {
  const context = useContext(PortalTabContext)
  if (context === undefined) {
    throw new Error("usePortalTab must be used within a PortalTabProvider")
  }
  return context
}
