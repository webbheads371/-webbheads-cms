"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { markWelcomeSeen } from "@/lib/supabase/portal-actions"

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
    <div className="wizard-step-content">
      <div className="welcome-icon">🎉</div>
      <h1 className="wizard-step-title">Welcome, {clientName}!</h1>
      <p className="wizard-step-subtitle">
        We&apos;re excited to work with you. This portal will guide you through the
        onboarding process — from signing your agreement to handing over your
        brand assets.
      </p>
      <div className="welcome-highlights">
        <div className="welcome-highlight-item">
          <span className="welcome-highlight-icon">📝</span>
          <div>
            <strong>Step 2 — Agreement</strong>
            <p>Review and sign your project agreement</p>
          </div>
        </div>
        <div className="welcome-highlight-item">
          <span className="welcome-highlight-icon">💳</span>
          <div>
            <strong>Step 3 — Advance Payment</strong>
            <p>Submit your advance payment (50%) to kick off the project</p>
          </div>
        </div>
        <div className="welcome-highlight-item">
          <span className="welcome-highlight-icon">📋</span>
          <div>
            <strong>Step 4 — Profile Handover</strong>
            <p>Share your brand assets, credentials, and details with our team</p>
          </div>
        </div>
      </div>
      <div className="wizard-step-actions">
        {error && <div className="text-destructive text-sm mb-3 font-medium bg-destructive/10 p-2 rounded">{error}</div>}
        <button
          onClick={handleNext}
          disabled={isPending}
          className="btn-primary btn-large"
          id="welcome-next-btn"
        >
          {isPending ? "Loading…" : "Let's Get Started →"}
        </button>
      </div>
    </div>
  )
}
