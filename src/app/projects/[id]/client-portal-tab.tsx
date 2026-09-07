"use client"

import { useState, useTransition } from "react"
import {
  markHandlesCollected,
  releaseFinalInvoice,
  postStatusUpdate,
  saveProjectPocSettings,
  saveProjectTimelineStages,
} from "@/lib/actions/admin-portal-actions"
import type { Project, PaymentRequest, ProjectStatusUpdate, Agreement } from "@/types"

interface ClientPortalTabProps {
  project: Project
  paymentRequests: PaymentRequest[]
  statusUpdates: ProjectStatusUpdate[]
  documents: any[]
  agreement: Agreement | null
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

export function ClientPortalTab({ project, paymentRequests, statusUpdates, documents, agreement }: ClientPortalTabProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [visibleToClient, setVisibleToClient] = useState(true)
  const [localUpdates, setLocalUpdates] = useState(statusUpdates)

  // Extract initial POC info from documents
  const initialEmail = documents.find((d) => d.doc_type === "poc_email")?.title ?? ""
  const initialWhatsapp = documents.find((d) => d.doc_type === "poc_whatsapp")?.title ?? ""
  const initialPhone = documents.find((d) => d.doc_type === "poc_phone")?.title ?? ""

  const [pocEmail, setPocEmail] = useState(initialEmail)
  const [pocWhatsapp, setPocWhatsapp] = useState(initialWhatsapp)
  const [pocPhone, setPocPhone] = useState(initialPhone)

  // Timeline stage status overrides
  const [timelineDesign, setTimelineDesign] = useState<string>(project.timeline_design_status || "")
  const [timelineDev, setTimelineDev] = useState<string>(project.timeline_dev_status || "")
  const [timelineReview, setTimelineReview] = useState<string>(project.timeline_review_status || "")
  const [timelineSuccess, setTimelineSuccess] = useState(false)

  const initialDesignName = project.timeline_design_name || "Design Phase"
  const initialDevName = project.timeline_dev_name || "Development"
  const initialReviewName = project.timeline_review_name || "Review"

  const [timelineDesignName, setTimelineDesignName] = useState(initialDesignName)
  const [timelineDevName, setTimelineDevName] = useState(initialDevName)
  const [timelineReviewName, setTimelineReviewName] = useState(initialReviewName)

  const handleSaveTimelineStages = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setTimelineSuccess(false)
    startTransition(async () => {
      const result = await saveProjectTimelineStages(
        project.id,
        timelineDesign || null,
        timelineDev || null,
        timelineReview || null,
        timelineDesignName,
        timelineDevName,
        timelineReviewName
      )
      if (result.error) {
        setError(result.error)
      } else {
        setTimelineSuccess(true)
        setTimeout(() => setTimelineSuccess(false), 3000)
      }
    })
  }

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

  const handleSavePoc = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await saveProjectPocSettings(project.id, pocEmail, pocWhatsapp, pocPhone)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="tab-panel">
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">✓ Point of contact details saved successfully!</div>}

      {/* Onboarding Progress */}
      <div className="tab-section">
        <h3 className="tab-section-title">Onboarding Progress</h3>
        <div className="onboarding-steps-list">
          <OnboardingStepStatus label="Step 1 — Welcome" done={!!project.welcome_seen_at} />
          <OnboardingStepStatus
            label="Step 2 — Agreement signed + signature uploaded"
            done={!!agreement?.client_agreed}
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

      {/* Project Timeline Stages Override */}
      <div className="tab-section">
        <h3 className="tab-section-title">Project Timeline Stages Override</h3>
        {timelineSuccess && <div className="success-banner mb-3">✓ Timeline stage overrides saved successfully!</div>}
        <form onSubmit={handleSaveTimelineStages} className="bank-settings-form">
          <p className="text-xs text-slate-500 mb-3" style={{ fontSize: "0.75rem", lineHeight: "1.25rem", color: "#6b7280" }}>
            Manually override the status for the project timeline stages displayed on the client dashboard. Set to <strong>Auto (Derived)</strong> to let the system automatically compute the status based on the current pipeline stage.
          </p>
          <div className="form-grid-3col shadow-xs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="timeline-design-name" style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem" }}>Phase 1 Name</label>
              <input
                id="timeline-design-name"
                type="text"
                value={timelineDesignName}
                onChange={(e) => setTimelineDesignName(e.target.value)}
                className="form-input mb-2"
                placeholder="e.g. Design Phase"
              />
              <label className="form-label" htmlFor="timeline-design" style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem" }}>Phase 1 Status</label>
              <select
                id="timeline-design"
                value={timelineDesign}
                onChange={(e) => setTimelineDesign(e.target.value)}
                className="form-select"
              >
                <option value="">Auto (Derived)</option>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="timeline-dev-name" style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem" }}>Phase 2 Name</label>
              <input
                id="timeline-dev-name"
                type="text"
                value={timelineDevName}
                onChange={(e) => setTimelineDevName(e.target.value)}
                className="form-input mb-2"
                placeholder="e.g. Development Phase"
              />
              <label className="form-label" htmlFor="timeline-dev" style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem" }}>Phase 2 Status</label>
              <select
                id="timeline-dev"
                value={timelineDev}
                onChange={(e) => setTimelineDev(e.target.value)}
                className="form-select"
              >
                <option value="">Auto (Derived)</option>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="timeline-review-name" style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem" }}>Phase 3 Name</label>
              <input
                id="timeline-review-name"
                type="text"
                value={timelineReviewName}
                onChange={(e) => setTimelineReviewName(e.target.value)}
                className="form-input mb-2"
                placeholder="e.g. Review Phase"
              />
              <label className="form-label" htmlFor="timeline-review" style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem" }}>Phase 3 Status</label>
              <select
                id="timeline-review"
                value={timelineReview}
                onChange={(e) => setTimelineReview(e.target.value)}
                className="form-select"
              >
                <option value="">Auto (Derived)</option>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary btn-sm"
          >
            {isPending ? "Saving..." : "Save Timeline Override"}
          </button>
        </form>
      </div>

      {/* Point of Contact Settings */}
      <div className="tab-section">
        <h3 className="tab-section-title">Point of Contact Details</h3>
        <form onSubmit={handleSavePoc} className="bank-settings-form">
          <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="poc-email">Company Email</label>
              <input
                id="poc-email"
                type="email"
                value={pocEmail}
                onChange={(e) => setPocEmail(e.target.value)}
                className="form-input"
                placeholder="e.g. support@webbheads.com"
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="poc-whatsapp">WhatsApp Number</label>
              <input
                id="poc-whatsapp"
                type="text"
                value={pocWhatsapp}
                onChange={(e) => setPocWhatsapp(e.target.value)}
                className="form-input"
                placeholder="e.g. 919999999999 (with country code)"
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="poc-phone">Phone Number</label>
              <input
                id="poc-phone"
                type="text"
                value={pocPhone}
                onChange={(e) => setPocPhone(e.target.value)}
                className="form-input"
                placeholder="e.g. +919999999999"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary btn-sm"
          >
            {isPending ? "Saving..." : "Save POC Details"}
          </button>
        </form>
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
            )
            }
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

