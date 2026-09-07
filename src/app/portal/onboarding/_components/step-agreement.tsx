"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { agreeToAgreement, uploadSignature } from "@/lib/actions/portal-actions"
import type { Agreement } from "@/types"
import { CheckCircle2, Paperclip, ArrowRight } from "lucide-react"

interface StepAgreementProps {
  projectId: string
  agreement: Agreement
}

export function StepAgreement({ projectId, agreement }: StepAgreementProps) {
  const router = useRouter()
  const [agreed, setAgreed] = useState(agreement.client_agreed)
  const [signatureUrl, setSignatureUrl] = useState(agreement.signature_url)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canProceed = agreed && !!signatureUrl

  const handleAgreeChange = async (checked: boolean) => {
    if (checked && !agreed) {
      setAgreed(true)
      startTransition(async () => {
        const result = await agreeToAgreement(projectId)
        if ((result as any)?.error) setError((result as any).error)
      })
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadSignature(projectId, formData)
    setUploading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSignatureUrl(result.url)
    }
  }

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Review & Sign Agreement</h2>
      <p className="wizard-step-subtitle">
        Please review the agreement below carefully before proceeding.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 w-full">
        {/* Document Viewer - Left Side */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col w-full">
          {agreement.agreement_type === "text" ? (
            <div className="agreement-pdf-container w-full lg:max-h-[750px] overflow-y-auto p-6 md:p-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div 
                className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: agreement.content_text || "No agreement content available."
                }}
              />
            </div>
          ) : (
            <div className="agreement-pdf-container w-full lg:max-h-[750px]">
              <iframe
                src={`${agreement.pdf_url}#view=FitH&navpanes=0&toolbar=0&scrollbar=0`}
                className="agreement-pdf-frame"
                title="Project Agreement"
              />
            </div>
          )}
        </div>

        {/* Actions - Right Side */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 self-start w-full">
          {/* Agree checkbox */}
          <div className="agreement-checkbox-row flex items-center gap-3 flex-wrap bg-white/40 dark:bg-white/5 backdrop-blur-md">
            <div className="flex items-start gap-3 w-full">
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={agreed}
                onChange={(e) => handleAgreeChange(e.target.checked)}
                disabled={agreed || isPending}
                className="agreement-checkbox mt-0.5"
              />
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="agree-checkbox" className="agreement-checkbox-label text-sm">
                  I have read and agree to the terms of the project agreement
                </label>
                {agreed && (
                  <span className="badge-success self-start flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Agreed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Signature upload */}
          <div className="signature-upload-section bg-white/40 dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/30 dark:border-white/10 shadow-sm">
            <h3 className="signature-upload-title text-base mb-1">Upload your signature</h3>
            <p className="signature-upload-hint mb-4">
              Upload an image of your handwritten signature (PNG, JPG, or JPEG)
            </p>
            {signatureUrl ? (
              <div className="signature-preview flex flex-col items-center gap-3 border border-white/30 dark:border-white/10 rounded-xl p-4 bg-white/60 dark:bg-black/20">
                <img src={signatureUrl} alt="Your signature" className="signature-img max-h-24 object-contain" />
                <span className="badge-success flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Signature uploaded
                </span>
              </div>
            ) : (
              <label className="file-upload-area min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl cursor-pointer bg-white/50 dark:bg-slate-900/50 transition-colors" id="signature-upload-label">
                <input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleSignatureUpload}
                  disabled={uploading}
                  className="hidden file-upload-input"
                />
                {uploading ? (
                  <span className="text-sm font-medium text-amber-600 animate-pulse">Uploading…</span>
                ) : (
                  <span className="flex flex-col items-center gap-2 text-muted-foreground text-sm p-4 text-center">
                    <Paperclip className="h-6 w-6 mb-1" />
                    <span>Click to browse or drag & drop</span>
                  </span>
                )}
              </label>
            )}
          </div>

          {error && <div className="error-banner animate-shake text-sm">{error}</div>}

          <div className="wizard-step-actions mt-2">
            <button
              disabled={!canProceed}
              className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
              id="agreement-next-btn"
              onClick={() => {
                // Re-fetch server component data client-side and advance the step
                router.refresh()
              }}
            >
              <span>Next: Advance Payment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
