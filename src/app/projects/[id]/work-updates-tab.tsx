"use client"

import { useState, useTransition } from "react"
import { postStatusUpdate } from "@/lib/actions/admin-portal-actions"
import type { ProjectStatusUpdate } from "@/types"

interface WorkUpdatesTabProps {
  projectId: string
  statusUpdates: ProjectStatusUpdate[]
}

export function WorkUpdatesTab({ projectId, statusUpdates }: WorkUpdatesTabProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [visibleToClient, setVisibleToClient] = useState(true)
  const [localUpdates, setLocalUpdates] = useState(statusUpdates)

  const handlePostUpdate = () => {
    if (!statusMessage.trim()) return
    startTransition(async () => {
      const result = await postStatusUpdate(projectId, statusMessage, visibleToClient)
      if (result.error) {
        setError(result.error)
      } else {
        setLocalUpdates((prev) => [
          {
            id: crypto.randomUUID(),
            project_id: projectId,
            message: statusMessage,
            posted_by: null,
            posted_at: new Date().toISOString(),
            visible_to_client: visibleToClient,
          },
          ...prev,
        ])
        setStatusMessage("")
      }
    })
  }

  return (
    <div className="tab-panel">
      {error && <div className="error-banner mb-4">{error}</div>}
      <div className="tab-section">
        <h3 className="tab-section-title">Post Status Update</h3>
        <div className="status-update-form">
          <textarea
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="e.g. Homepage design is in progress…"
            className="form-textarea"
            rows={3}
            id="status-update-message"
          />
          <div className="status-update-form-footer">
            <div className="form-checkbox-inline">
              <input
                type="checkbox"
                id="status-visible-to-client"
                checked={visibleToClient}
                onChange={(e) => setVisibleToClient(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="status-visible-to-client" className="form-label">
                Visible to client
              </label>
            </div>
            <button
              onClick={handlePostUpdate}
              disabled={isPending || !statusMessage.trim()}
              className="btn-primary btn-sm"
              id="post-status-update-btn"
            >
              {isPending ? "Posting…" : "Post Update"}
            </button>
          </div>
        </div>

        {/* Recent updates */}
        {localUpdates.length > 0 && (
          <div className="status-updates-history">
            <h4 className="tab-section-subtitle">Recent Updates</h4>
            {localUpdates.slice(0, 10).map((update) => (
              <div key={update.id} className="status-update-history-item">
                <div className="status-update-history-message">{update.message}</div>
                <div className="status-update-history-meta">
                  <span>{new Date(update.posted_at).toLocaleString("en-IN")}</span>
                  <span className={update.visible_to_client ? "badge-success text-xs" : "badge-gray text-xs"}>
                    {update.visible_to_client ? "Client visible" : "Internal only"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
