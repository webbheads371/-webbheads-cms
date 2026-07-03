"use client"

import { useState, useTransition } from "react"
import { agreeToAgreement, uploadSignature } from "@/lib/supabase/portal-actions"
import type { Agreement } from "@/types"

interface StepAgreementProps {
  projectId: string
  agreement: Agreement
}

export function StepAgreement({ projectId, agreement }: StepAgreementProps) {
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
      <div className="agreement-checkbox-row">
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
        {agreed && <span className="badge-success">✓ Agreed</span>}
      </div>

      {/* Signature upload */}
      <div className="signature-upload-section">
        <h3 className="signature-upload-title">Upload your signature</h3>
        <p className="signature-upload-hint">
          Upload an image of your handwritten signature (PNG, JPG, or JPEG)
        </p>
        {signatureUrl ? (
          <div className="signature-preview">
            <img src={signatureUrl} alt="Your signature" className="signature-img" />
            <span className="badge-success">✓ Signature uploaded</span>
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
              <>
                <span className="file-upload-icon">📎</span>
                <span>Click to upload signature image</span>
              </>
            )}
          </label>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="wizard-step-actions">
        <button
          disabled={!canProceed}
          className="btn-primary btn-large"
          id="agreement-next-btn"
          onClick={() => {
            // The parent page will re-fetch and advance the step
            window.location.reload()
          }}
        >
          Next: Advance Payment →
        </button>
        {!canProceed && (
          <p className="wizard-step-hint">
            Please agree to the terms and upload your signature to continue.
          </p>
        )}
      </div>
    </div>
  )
}
