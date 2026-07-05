"use client"

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from "react"
import { useSearchParams } from "next/navigation"

type TabType = "home" | "credentials" | "documents" | "payments" | "support"

interface PortalTabContextProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const PortalTabContext = createContext<PortalTabContextProps | undefined>(undefined)

function PortalTabContextInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as TabType | null
  const initialTab = tabParam && ["home", "credentials", "documents", "payments", "support"].includes(tabParam)
    ? tabParam
    : "home"
  const [activeTab, setActiveTabState] = useState<TabType>(initialTab)

  // Keep state in sync if URL changes externally (e.g. initial load)
  useEffect(() => {
    const tab = searchParams.get("tab") as TabType
    if (tab && ["home", "credentials", "documents", "payments", "support"].includes(tab)) {
      setActiveTabState(tab)
    } else if (!tab) {
      setActiveTabState("home")
    }
  }, [searchParams])

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab)
    // Update the URL client-side without triggering Next.js server-side re-render
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
