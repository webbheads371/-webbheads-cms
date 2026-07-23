"use client"

import { useState } from "react"
import { approveDeliverables } from "@/lib/supabase/portal-actions"
import type { Project } from "@/types"
import { CheckCircle2, ArrowRight } from "lucide-react"

interface StepDeliverablesProps {
  project: Project
}

export function StepDeliverables({ project }: StepDeliverablesProps) {
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await approveDeliverables(project.id)
    // redirect happens in action
  }

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Project Deliverables</h2>
      <p className="wizard-step-subtitle">
        Please review the deliverables for your project below. These are the key items and services we will be providing.
      </p>

      <div className="bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl p-6 backdrop-blur-sm max-h-[400px] overflow-y-auto">
        <div 
          className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-slate-800 dark:text-slate-200"
          dangerouslySetInnerHTML={{ 
            __html: project.deliverables_content || "No deliverables have been specified yet. Please contact support."
          }}
        />
      </div>

      {project.deliverables_content && (
        <>
          <div className="agreement-checkbox-row flex items-center gap-3 flex-wrap mt-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agree-deliverables"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={submitting}
                className="agreement-checkbox"
              />
              <label htmlFor="agree-deliverables" className="agreement-checkbox-label">
                I have reviewed and approve the deliverables listed above.
              </label>
            </div>
            {agreed && (
              <span className="badge-success flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approved
              </span>
            )}
          </div>

          <div className="wizard-step-actions mt-8">
            <button
              disabled={!agreed || submitting}
              onClick={handleSubmit}
              className="btn-primary btn-large flex items-center justify-center gap-2 mx-auto"
            >
              <span>{submitting ? "Approving..." : "Approve & Continue to Agreement"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            {!agreed && (
              <p className="wizard-step-hint text-center mt-2">
                Please approve the deliverables to continue.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
