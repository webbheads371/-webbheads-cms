"use client"

import { useEffect, useState } from "react"

interface ClientGreetingProps {
  clientName: string
}

export function ClientGreeting({ clientName }: ClientGreetingProps) {
  const [greeting, setGreeting] = useState("Good morning")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning")
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }
  }, [])

  return (
    <h1 className="dashboard-title animate-fade-in font-bold text-4xl md:text-[48px] tracking-tight text-[#111827] dark:text-white leading-[1.15] mb-2">
      Welcome back, {clientName}!
    </h1>
  )
}
