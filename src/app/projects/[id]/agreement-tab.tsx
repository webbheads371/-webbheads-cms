"use client"

import { useState, useRef, useTransition } from "react"
import { uploadAgreementPdf } from "@/lib/supabase/admin-portal-actions"
import type { Agreement } from "@/types"

interface AgreementTabProps {
  projectId: string
  agreement: Agreement | null
}

export function AgreementTab({ projectId, agreement }: AgreementTabProps) {
  const [currentAgreement, setCurrentAgreement] = useState(agreement)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    const result = await uploadAgreementPdf(projectId, formData)
    setUploading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      window.location.reload()
    }
  }

  return (
    <div className="tab-panel">
      <div className="tab-section">
        <h3 className="tab-section-title">Agreement PDF</h3>
        {currentAgreement?.pdf_url ? (
          <div className="agreement-admin-view">
            <div className="agreement-admin-status-row">
              <span className="form-label">Current PDF</span>
              <a href={currentAgreement.pdf_url} target="_blank" rel="noreferrer" className="link">
                View PDF ↗
              </a>
            </div>
            <iframe
              src={currentAgreement.pdf_url}
              className="agreement-pdf-frame"
              title="Agreement PDF"
            />
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <p>No agreement uploaded yet.</p>
          </div>
        )}
        <div className="mt-4">
          <label className="form-label" htmlFor="agreement-pdf-upload">
            {currentAgreement?.pdf_url ? "Replace PDF" : "Upload Agreement PDF"}
          </label>
          <label className="file-upload-area file-upload-area-sm" id="agreement-pdf-label">
            <input
              id="agreement-pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              disabled={uploading}
              className="file-upload-input"
            />
            {uploading ? "Uploading…" : "📄 Upload PDF"}
          </label>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">✓ Agreement PDF uploaded!</div>}
      </div>

      {/* Client agreement status */}
      <div className="tab-section">
        <h3 className="tab-section-title">Client Agreement Status</h3>
        <div className="agreement-status-grid">
          <div className="agreement-status-item">
            <span className="agreement-status-label">Agreed to Agreement</span>
            {currentAgreement?.client_agreed ? (
              <div>
                <span className="badge-success">✓ Yes</span>
                {currentAgreement.agreed_at && (
                  <span className="agreement-status-date">
                    {new Date(currentAgreement.agreed_at).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            ) : (
              <span className="badge-pending">Pending</span>
            )}
          </div>
          <div className="agreement-status-item">
            <span className="agreement-status-label">Signature Uploaded</span>
            {currentAgreement?.signature_url ? (
              <div className="agreement-signature-preview">
                <img
                  src={currentAgreement.signature_url}
                  alt="Client signature"
                  className="signature-img-sm"
                />
                <span className="badge-success">✓ Uploaded</span>
                {currentAgreement.signature_uploaded_at && (
                  <span className="agreement-status-date">
                    {new Date(currentAgreement.signature_uploaded_at).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            ) : (
              <span className="badge-pending">Pending</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
