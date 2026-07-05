"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { agreeToAgreement, uploadSignature } from "@/lib/supabase/portal-actions"
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
        if (result.error) setError(result.error)
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

      {/* PDF Viewer */}
      <div className="agreement-pdf-container">
        <iframe
          src={agreement.pdf_url}
          className="agreement-pdf-frame"
          title="Project Agreement"
        />
      </div>

      {/* Agree checkbox */}
      <div className="agreement-checkbox-row flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="agree-checkbox"
            checked={agreed}
            onChange={(e) => handleAgreeChange(e.target.checked)}
            disabled={agreed || isPending}
            className="agreement-checkbox"
          />
          <label htmlFor="agree-checkbox" className="agreement-checkbox-label">
            I have read and agree to the terms of the project agreement
          </label>
        </div>
        {agreed && (
          <span className="badge-success flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Agreed
          </span>
        )}
      </div>

      {/* Signature upload */}
      <div className="signature-upload-section">
        <h3 className="signature-upload-title">Upload your signature</h3>
        <p className="signature-upload-hint">
          Upload an image of your handwritten signature (PNG, JPG, or JPEG)
        </p>
        {signatureUrl ? (
          <div className="signature-preview flex flex-col items-center gap-2 border rounded-xl p-4 bg-background/50 max-w-sm">
            <img src={signatureUrl} alt="Your signature" className="signature-img" />
            <span className="badge-success flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Signature uploaded
            </span>
          </div>
        ) : (
          <label className="file-upload-area" id="signature-upload-label">
            <input
              type="file"
              accept="image/png,image/jpg,image/jpeg"
              onChange={handleSignatureUpload}
              disabled={uploading}
              className="file-upload-input"
            />
            {uploading ? (
              <span>Uploading…</span>
            ) : (
              <span className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <span>Click to upload signature image</span>
              </span>
            )}
          </label>
        )}
      </div>

      {error && <div className="error-banner mt-4">{error}</div>}

      <div className="wizard-step-actions mt-8">
        <button
          disabled={!canProceed}
          className="btn-primary btn-large flex items-center justify-center gap-2 mx-auto"
          id="agreement-next-btn"
          onClick={() => {
            // Re-fetch server component data client-side and advance the step
            router.refresh()
          }}
        >
          <span>Next: Advance Payment</span>
          <ArrowRight className="h-4 w-4" />
        </button>
        {!canProceed && (
          <p className="wizard-step-hint text-center mt-2">
            Please agree to the terms and upload your signature to continue.
          </p>
        )}
      </div>
    </div>
  )
}
