"use client"

import { useState, useTransition } from "react"
import { approvePaymentRequest, rejectPaymentRequest } from "@/lib/supabase/admin-portal-actions"

interface PaymentWithProject {
  id: string
  project_id: string
  request_type: "advance" | "final"
  amount: number
  status: string
  screenshot_url: string | null
  submitted_at: string | null
  rejection_reason: string | null
  project?: {
    id: string
    name: string
    project_value: number | null
    client?: {
      company_name: string
      contact_name: string | null
    } | null
  } | null
}

interface PaymentQueueClientProps {
  payments: PaymentWithProject[]
}

export function PaymentQueueClient({ payments: initialPayments }: PaymentQueueClientProps) {
  const [payments, setPayments] = useState(initialPayments)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleApprove = (payment: PaymentWithProject) => {
    startTransition(async () => {
      const result = await approvePaymentRequest(payment.id, payment.project_id)
      if (result.error) {
        setError(result.error)
      } else {
        setPayments((prev) => prev.filter((p) => p.id !== payment.id))
      }
    })
  }

  const handleReject = (payment: PaymentWithProject) => {
    if (!rejectionReason.trim()) return
    startTransition(async () => {
      const result = await rejectPaymentRequest(payment.id, payment.project_id, rejectionReason)
      if (result.error) {
        setError(result.error)
      } else {
        setPayments((prev) => prev.filter((p) => p.id !== payment.id))
        setRejectingId(null)
        setRejectionReason("")
      }
    })
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)

  if (payments.length === 0) {
    return (
      <div className="dashboard-empty-state">
        <span className="dashboard-empty-icon">✅</span>
        <p>No pending payment verifications!</p>
        <span className="dashboard-empty-hint">All payments have been reviewed.</span>
      </div>
    )
  }

  return (
    <div className="payment-queue-list">
      {error && <div className="error-banner">{error}</div>}

      {payments.map((payment) => (
        <div key={payment.id} className="payment-queue-card">
          <div className="payment-queue-card-header">
            <div className="payment-queue-info">
              <div className="payment-queue-client">
                <strong>{payment.project?.client?.company_name ?? "Unknown Client"}</strong>
                {payment.project?.client?.contact_name && (
                  <span className="payment-queue-contact"> — {payment.project.client.contact_name}</span>
                )}
              </div>
              <div className="payment-queue-project">{payment.project?.name}</div>
            </div>
            <div className="payment-queue-right">
              <span className={`badge ${payment.request_type === "advance" ? "badge-blue" : "badge-purple"}`}>
                {payment.request_type === "advance" ? "Advance" : "Final"} Payment
              </span>
              <span className="payment-queue-amount">{formatCurrency(payment.amount)}</span>
            </div>
          </div>

          {payment.submitted_at && (
            <div className="payment-queue-date">
              Submitted: {new Date(payment.submitted_at).toLocaleString("en-IN")}
            </div>
          )}

          {/* Screenshot preview */}
          {payment.screenshot_url && (
            <a
              href={payment.screenshot_url}
              target="_blank"
              rel="noreferrer"
              className="payment-queue-screenshot-link"
            >
              <img
                src={payment.screenshot_url}
                alt="Payment screenshot"
                className="payment-queue-screenshot"
              />
              <span className="link">View full screenshot ↗</span>
            </a>
          )}

          {/* Actions */}
          <div className="payment-queue-actions">
            {rejectingId === payment.id ? (
              <div className="payment-reject-form">
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (required)"
                  className="form-input"
                  id={`reject-reason-${payment.id}`}
                />
                <button
                  onClick={() => handleReject(payment)}
                  disabled={isPending || !rejectionReason.trim()}
                  className="btn-danger"
                  id={`confirm-reject-${payment.id}`}
                >
                  {isPending ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button
                  onClick={() => { setRejectingId(null); setRejectionReason("") }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleApprove(payment)}
                  disabled={isPending}
                  className="btn-success"
                  id={`approve-payment-${payment.id}`}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setRejectingId(payment.id)}
                  disabled={isPending}
                  className="btn-danger"
                  id={`reject-payment-${payment.id}`}
                >
                  ✗ Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
