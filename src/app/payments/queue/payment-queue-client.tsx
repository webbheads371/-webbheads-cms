"use client"

import { useState, useTransition } from "react"
import { approvePaymentRequest, rejectPaymentRequest } from "@/lib/supabase/admin-portal-actions"
import { CheckCircle2, ExternalLink, Check, X } from "lucide-react"

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
      <div className="dashboard-empty-state text-center py-12 flex flex-col items-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
        <p className="font-bold text-lg">No pending payment verifications!</p>
        <span className="dashboard-empty-hint text-sm text-muted-foreground">All payments have been reviewed.</span>
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
              className="payment-queue-screenshot-link inline-flex flex-col items-start gap-1"
            >
              <img
                src={payment.screenshot_url}
                alt="Payment screenshot"
                className="payment-queue-screenshot"
              />
              <span className="link flex items-center gap-1 text-sm font-semibold">
                View full screenshot <ExternalLink className="h-3 w-3" />
              </span>
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
                  className="btn-danger flex items-center gap-1"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(payment)}
                  disabled={isPending}
                  className="btn-success flex items-center gap-1.5 py-2 px-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                  id={`approve-payment-${payment.id}`}
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => setRejectingId(payment.id)}
                  disabled={isPending}
                  className="btn-danger flex items-center gap-1.5 py-2 px-4 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                  id={`reject-payment-${payment.id}`}
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
