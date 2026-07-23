"use client"

import { useState } from "react"
import { uploadAgreementPdf, saveAgreementText } from "@/lib/supabase/admin-portal-actions"
import type { Agreement } from "@/types"

interface AgreementTabProps {
  projectId: string
  agreement: Agreement | null
}

export function AgreementTab({ projectId, agreement }: AgreementTabProps) {
  const [currentAgreement] = useState(agreement)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [mode, setMode] = useState<"pdf" | "text">(agreement?.agreement_type || "pdf")
  const [textContent, setTextContent] = useState(agreement?.content_text || "")
  const [savingText, setSavingText] = useState(false)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
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

  const handleSaveText = async () => {
    setSavingText(true)
    setError(null)
    const result = await saveAgreementText(projectId, textContent)
    setSavingText(false)
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="tab-section-title mb-0">Agreement Terms</h3>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setMode("pdf")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                mode === "pdf" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              PDF Upload
            </button>
            <button
              onClick={() => setMode("text")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                mode === "text" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Rich Text
            </button>
          </div>
        </div>

        {mode === "pdf" ? (
          <div className="animate-fade-in">
            {currentAgreement?.agreement_type === "pdf" && currentAgreement.pdf_url ? (
              <div className="agreement-admin-view">
                <div className="agreement-admin-status-row">
                  <span className="form-label">Current PDF</span>
                  <a href={currentAgreement.pdf_url} target="_blank" rel="noreferrer" className="link">
                    View PDF ↗
                  </a>
                </div>
                <iframe
                  src={`${currentAgreement.pdf_url}#view=FitH&navpanes=0&toolbar=0`}
                  className="agreement-pdf-frame"
                  title="Agreement PDF"
                />
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <p>No PDF agreement uploaded yet.</p>
              </div>
            )}
            <div className="mt-4">
              <label className="form-label" htmlFor="agreement-pdf-upload">
                {currentAgreement?.agreement_type === "pdf" ? "Replace PDF" : "Upload Agreement PDF"}
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
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col gap-4">
            {currentAgreement?.agreement_type === "text" ? (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-900/30">
                Text agreement is currently active for this client.
              </div>
            ) : currentAgreement?.agreement_type === "pdf" ? (
              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-900/30">
                Warning: Saving this will replace the current PDF agreement with text.
              </div>
            ) : null}
            
            <div>
              <label className="form-label block mb-2">Agreement Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter the agreement terms and conditions here..."
                className="w-full min-h-[400px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono whitespace-pre-wrap"
              />
            </div>
            <button
              onClick={handleSaveText}
              disabled={savingText || !textContent.trim()}
              className="btn-primary self-start"
            >
              {savingText ? "Saving..." : "Save Text Agreement"}
            </button>
          </div>
        )}

        {error && <div className="error-banner mt-4">{error}</div>}
        {success && <div className="success-banner mt-4">✓ Agreement updated successfully!</div>}
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
