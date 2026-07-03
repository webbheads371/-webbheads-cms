"use client"

import { useState, useTransition } from "react"
import {
  markHandlesCollected,
  releaseFinalInvoice,
  postStatusUpdate,
} from "@/lib/supabase/admin-portal-actions"
import type { Project, PaymentRequest, ProjectStatusUpdate } from "@/types"

interface ClientPortalTabProps {
  project: Project
  paymentRequests: PaymentRequest[]
  statusUpdates: ProjectStatusUpdate[]
}

function OnboardingStepStatus({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="onboarding-step-row">
      <span className={`onboarding-step-dot ${done ? "onboarding-step-dot-done" : ""}`} />
      <span className={done ? "onboarding-step-label-done" : "onboarding-step-label-pending"}>
        {label}
      </span>
      <span className={done ? "badge-success" : "badge-pending"}>
        {done ? "✓ Complete" : "Pending"}
      </span>
    </div>
  )
}

export function ClientPortalTab({ project, paymentRequests, statusUpdates }: ClientPortalTabProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [visibleToClient, setVisibleToClient] = useState(true)
  const [localUpdates, setLocalUpdates] = useState(statusUpdates)

  const advancePayment = paymentRequests.find((p) => p.request_type === "advance")
  const finalPayment = paymentRequests.find((p) => p.request_type === "final")

  const handleMarkHandles = () => {
    if (!confirm("Mark handles/logins as collected?")) return
    startTransition(async () => {
      const result = await markHandlesCollected(project.id)
      if (result.error) setError(result.error)
      else window.location.reload()
    })
  }

  const handleReleaseFinalInvoice = () => {
    if (!confirm("Release the final invoice to the client? They will see the payment section immediately.")) return
    startTransition(async () => {
      const result = await releaseFinalInvoice(project.id)
      if (result.error) setError(result.error)
      else window.location.reload()
    })
  }

  const handlePostUpdate = () => {
    if (!statusMessage.trim()) return
    startTransition(async () => {
      const result = await postStatusUpdate(project.id, statusMessage, visibleToClient)
      if (result.error) {
        setError(result.error)
      } else {
        setLocalUpdates((prev) => [
          {
            id: crypto.randomUUID(),
            project_id: project.id,
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
      {error && <div className="error-banner">{error}</div>}

      {/* Onboarding Progress */}
      <div className="tab-section">
        <h3 className="tab-section-title">Onboarding Progress</h3>
        <div className="onboarding-steps-list">
          <OnboardingStepStatus label="Step 1 — Welcome" done={!!project.welcome_seen_at} />
          <OnboardingStepStatus
            label="Step 2 — Agreement signed + signature uploaded"
            done={false /* Checked via agreement prop — simplified here */}
          />
          <OnboardingStepStatus
            label="Step 3 — Advance payment approved"
            done={advancePayment?.status === "approved"}
          />
          <OnboardingStepStatus
            label="Step 4 — Profile submitted"
            done={!!project.profile_submitted_at}
          />
        </div>
      </div>

      {/* Admin Controls */}
      <div className="tab-section">
        <h3 className="tab-section-title">Admin Controls</h3>
        <div className="admin-controls-grid">
          {/* Mark handles collected */}
          <div className="admin-control-card">
            <div className="admin-control-info">
              <strong>Handles / Logins Collected</strong>
              <p>Mark when you have received all account credentials from the client.</p>
            </div>
            {project.handles_collected ? (
              <span className="badge-success">
                ✓ Collected on {new Date(project.handles_collected_at!).toLocaleDateString("en-IN")}
              </span>
            ) : (
              <button
                onClick={handleMarkHandles}
                disabled={isPending}
                className="btn-secondary btn-sm"
                id="mark-handles-collected-btn"
              >
                Mark as Collected
              </button>
            )}
          </div>

          {/* Release final invoice */}
          <div className="admin-control-card">
            <div className="admin-control-info">
              <strong>Release Final Invoice</strong>
              <p>
                {finalPayment
                  ? `Final amount: ₹${finalPayment.amount.toLocaleString("en-IN")}`
                  : "Advance payment must be approved first to auto-calculate final amount."}
              </p>
            </div>
            {finalPayment?.released ? (
              <span className="badge-success">✓ Released</span>
            ) : (
              <button
                onClick={handleReleaseFinalInvoice}
                disabled={isPending || !finalPayment}
                className="btn-primary btn-sm"
                id="release-final-invoice-btn"
                title={!finalPayment ? "Approve advance payment first" : ""}
              >
                Release to Client
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Post Status Update */}
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
