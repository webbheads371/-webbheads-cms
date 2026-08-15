"use client"

import { ReactNode } from "react"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { WizardStepper } from "./wizard-stepper"

interface OnboardingWrapperProps {
  currentStep: number
  children: ReactNode
}

export function OnboardingWrapper({
  currentStep,
  children,
}: OnboardingWrapperProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex md:hidden items-center justify-between gap-2 px-2">
        <div className="flex items-center shrink-0">
          <img
            src="/logo.png"
            alt="WebbHeads Logo"
            className="h-9 w-9 object-contain shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-300"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)" }}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>

      <div className="wizard-layout">
        <WizardStepper currentStep={currentStep} />
        <div className="wizard-card">{children}</div>
      </div>
    </div>
  )
}
