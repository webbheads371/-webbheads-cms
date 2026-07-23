"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { saveProjectDeliverables } from "@/lib/supabase/admin-portal-actions"
import type { Project } from "@/types"

interface DeliverablesTabProps {
  project: Project
}

export function DeliverablesTab({ project }: DeliverablesTabProps) {
  const [content, setContent] = useState(project.deliverables_content || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    const result = await saveProjectDeliverables(project.id, content)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="tab-panel">
      <div className="tab-section">
        <h3 className="tab-section-title">Project Deliverables (Client Facing)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the deliverables for this project. This content will be shown to the client in the onboarding portal before they sign the agreement.
        </p>

        <div className="space-y-4">
          <textarea
            className="w-full min-h-[200px] p-3 border rounded-md bg-background focus:ring-2 focus:ring-primary/50"
            placeholder="E.g.
1. 5-page Custom Website
2. SEO Optimization
3. Payment Gateway Integration"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">✓ Deliverables saved successfully!</div>}

          <div className="flex justify-end gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Deliverables"}
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
