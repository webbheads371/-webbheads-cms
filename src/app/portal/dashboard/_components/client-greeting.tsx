"use client"

import { useEffect, useState } from "react"
import { Sunrise, Sun, Sunset, Moon } from "lucide-react"

interface ClientGreetingProps {
  clientName: string
}

const greetingConfig = {
  morning:   { text: "Good morning",   Icon: Sunrise, color: "text-amber-500" },
  afternoon: { text: "Good afternoon", Icon: Sun,     color: "text-orange-500" },
  evening:   { text: "Good evening",   Icon: Sunset,  color: "text-rose-500"   },
  night:     { text: "Good night",     Icon: Moon,    color: "text-indigo-400"  },
} as const

type TimeKey = keyof typeof greetingConfig

export function ClientGreeting({ clientName }: ClientGreetingProps) {
  const [timeKey, setTimeKey] = useState<TimeKey>("morning")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12)       setTimeKey("morning")
    else if (hour >= 12 && hour < 17) setTimeKey("afternoon")
    else if (hour >= 17 && hour < 21) setTimeKey("evening")
    else                               setTimeKey("night")
  }, [])

  const { text, Icon, color } = greetingConfig[timeKey]

  return (
    <h1 className="dashboard-title animate-fade-in font-bold text-4xl md:text-[48px] tracking-tight text-[#111827] dark:text-white leading-[1.15] mb-2 flex items-center gap-3">
      <Icon className={`h-9 w-9 md:h-11 md:w-11 shrink-0 ${color}`} strokeWidth={1.8} />
      {text}, {clientName}!
    </h1>
  )
}
