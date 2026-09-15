"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { saveProjectDeliverables } from "@/lib/actions/admin-portal-actions"
import type { Project } from "@/types"
import { FileText, FileDown, Trash2, Upload, ExternalLink, CheckCircle2 } from "lucide-react"

interface DeliverablesTabProps {
  project: Project
}

export function DeliverablesTab({ project }: DeliverablesTabProps) {
  const [content, setContent] = useState(project.deliverables_content || "")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(project.deliverables_pdf_url || null)
  const [removePdf, setRemovePdf] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append("content", content)
    if (pdfFile) {
      formData.append("file", pdfFile)
    }
    if (removePdf) {
      formData.append("removePdf", "true")
    }

    const result = await saveProjectDeliverables(project.id, formData)
    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      if (pdfFile) {
        setPdfFile(null)
      }
      if (removePdf) {
        setPdfUrl(null)
        setRemovePdf(false)
      }
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please select a valid PDF file.")
        return
      }
      setError(null)
      setPdfFile(file)
      setRemovePdf(false)
    }
  }

  const handleRemovePdf = () => {
    setPdfFile(null)
    setRemovePdf(true)
  }

  return (
    <div className="tab-panel space-y-6">
      <div className="tab-section">
        <h3 className="tab-section-title">Project Deliverables (Client Facing)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter written deliverables, upload a deliverables PDF document, or both. This will be shown to the client in their onboarding portal.
        </p>

        <div className="space-y-6">
          {/* Text Deliverables Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <FileText className="h-4 w-4 text-amber-500" />
              <span>Deliverables Description (Written Text)</span>
            </label>
            <textarea
              className="w-full min-h-[160px] p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="E.g.
1. 5-page Custom Website
2. SEO Optimization & Content Setup
3. Payment Gateway Integration"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* PDF Deliverable Upload Section */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-sm font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <FileDown className="h-4 w-4 text-amber-500" />
              <span>Deliverables PDF Document</span>
            </label>

            {pdfUrl && !removePdf ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileDown className="h-5 w-5 text-red-500 shrink-0" />
                    <span className="text-sm font-medium truncate">Deliverables Document (PDF)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={handleRemovePdf}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove PDF
                    </Button>
                  </div>
                </div>

                <div className="agreement-pdf-container w-full lg:max-h-[750px]">
                  <iframe
                    src={`${pdfUrl}#view=FitH&navpanes=0&toolbar=0`}
                    className="agreement-pdf-frame"
                    title="Deliverables PDF Document"
                  />
                </div>
              </div>
            ) : null}

            {pdfFile ? (
              <div className="flex items-center justify-between p-3 border border-amber-300 dark:border-amber-700/50 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-sm text-amber-800 dark:text-amber-300 font-medium truncate">
                  Ready to upload: {pdfFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => setPdfFile(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : null}

            {(!pdfUrl || removePdf) && !pdfFile ? (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-lg cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground font-medium">
                  Upload Deliverables PDF Document
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Accepts PDF format</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : null}
          </div>

          {error && <div className="error-banner">{error}</div>}
          {success && (
            <div className="success-banner flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Deliverables saved successfully!
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving Deliverables..." : "Save Deliverables"}
            </Button>
          </div>
        </div>
      </div>

      <div className="tab-section">
        <h3 className="tab-section-title">Client Approval Status</h3>
        <div className="agreement-status-grid">
          <div className="agreement-status-item">
            <span className="agreement-status-label">Client Approved Deliverables</span>
            {project.deliverables_approved ? (
              <div>
                <span className="badge-success">✓ Yes</span>
                {project.deliverables_approved_at && (
                  <span className="agreement-status-date">
                    {new Date(project.deliverables_approved_at).toLocaleString("en-IN")}
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
