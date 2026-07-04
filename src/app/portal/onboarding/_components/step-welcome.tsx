"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { markWelcomeSeen } from "@/lib/supabase/portal-actions"
import { Sparkles, FileSignature, CreditCard, ClipboardList, ArrowRight } from "lucide-react"

interface StepWelcomeProps {
  clientName: string
  projectId: string
}

export function StepWelcome({ clientName, projectId }: StepWelcomeProps) {
  const [isPending, startTransition] = useTransition()

  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleNext = () => {
    setError(null)
    startTransition(async () => {
      const result = await markWelcomeSeen(projectId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="wizard-step-content flex flex-col items-center text-center">
      <div className="welcome-icon-container p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl mb-4 border border-amber-100 dark:border-amber-900/30">
        <Sparkles className="h-12 w-12 text-amber-500 animate-pulse" />
      </div>
      <h1 className="wizard-step-title text-3xl font-extrabold tracking-tight">Welcome, {clientName}!</h1>
      <p className="wizard-step-subtitle text-muted-foreground max-w-lg mt-2 text-base">
        We&apos;re excited to work with you. This portal will guide you through the
        onboarding process — from signing your agreement to handing over your
        brand assets.
      </p>
      <div className="welcome-highlights w-full max-w-md text-left mt-8 space-y-4">
        <div className="welcome-highlight-item flex items-start gap-4 p-4 border rounded-xl bg-card/60 shadow-sm hover:shadow-md transition-all">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-foreground">Step 2 — Agreement</strong>
            <p className="text-xs text-muted-foreground mt-0.5">Review and sign your project agreement</p>
          </div>
        </div>
        <div className="welcome-highlight-item flex items-start gap-4 p-4 border rounded-xl bg-card/60 shadow-sm hover:shadow-md transition-all">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-foreground">Step 3 — Advance Payment</strong>
            <p className="text-xs text-muted-foreground mt-0.5">Submit your advance payment (50%) to kick off the project</p>
          </div>
        </div>
        <div className="welcome-highlight-item flex items-start gap-4 p-4 border rounded-xl bg-card/60 shadow-sm hover:shadow-md transition-all">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <strong className="text-sm font-bold text-foreground">Step 4 — Profile Handover</strong>
            <p className="text-xs text-muted-foreground mt-0.5">Share your brand assets, credentials, and details with our team</p>
          </div>
        </div>
      </div>
      <div className="wizard-step-actions w-full max-w-md mt-8">
        {error && <div className="text-destructive text-sm mb-3 font-medium bg-destructive/10 p-2 rounded">{error}</div>}
        <button
          onClick={handleNext}
          disabled={isPending}
          className="btn-primary btn-large flex items-center justify-center gap-2 mx-auto"
          id="welcome-next-btn"
        >
          {isPending ? "Loading…" : (
            <>
              Let&apos;s Get Started
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
