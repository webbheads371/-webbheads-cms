"use client"

import { useState } from "react"
import { approveDeliverables } from "@/lib/actions/portal-actions"
import type { Project } from "@/types"
import { CheckCircle2, ArrowRight, ExternalLink, FileText, FileDown } from "lucide-react"

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

  const hasContent = !!project.deliverables_content
  const hasPdf = !!project.deliverables_pdf_url
  const hasDeliverables = hasContent || hasPdf

  return (
    <div className="wizard-step-content space-y-6">
      <div>
        <h2 className="wizard-step-title">Project Deliverables</h2>
        <p className="wizard-step-subtitle">
          Please review the deliverables for your project below. These are the key items and services we will be providing.
        </p>
      </div>

      {!hasDeliverables && (
        <div className="bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl p-6 backdrop-blur-sm text-center">
          <p className="text-slate-600 dark:text-slate-400">
            No deliverables have been specified yet. Please contact support.
          </p>
        </div>
      )}

      {/* Render Written Text Deliverables if present */}
      {hasContent && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <FileText className="h-4 w-4 text-amber-500" /> Deliverables Overview
          </h3>
          <div className="bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl p-6 backdrop-blur-sm max-h-[350px] overflow-y-auto">
            <div
              className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-slate-800 dark:text-slate-200"
              dangerouslySetInnerHTML={{
                __html: project.deliverables_content!
              }}
            />
          </div>
        </div>
      )}

      {/* Render Embedded PDF Viewer & Download Link if present */}
      {hasPdf && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <FileDown className="h-4 w-4 text-amber-500" /> Deliverables Document (PDF)
            </h3>
            <a
              href={project.deliverables_pdf_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40 transition-colors"
            >
              <span>Open PDF in New Tab</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="agreement-pdf-container w-full lg:max-h-[750px]">
            <iframe
              src={`${project.deliverables_pdf_url}#view=FitH&navpanes=0&toolbar=0`}
              className="agreement-pdf-frame"
              title="Deliverables Document PDF"
            />
          </div>
        </div>
      )}

      {hasDeliverables && (
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
