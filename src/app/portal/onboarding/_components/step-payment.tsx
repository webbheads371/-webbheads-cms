"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { uploadPaymentScreenshot } from "@/lib/supabase/portal-actions"
import type { BankSettings, PaymentRequest } from "@/types"
import { Upload, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"

interface StepPaymentProps {
  projectId: string
  project: {
    project_value: number | null
    advance_percent: number | null
  }
  bankSettings: BankSettings | null
  paymentRequest: PaymentRequest | null
}

export function StepPayment({
  projectId,
  project,
  bankSettings,
  paymentRequest,
}: StepPaymentProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState(paymentRequest?.status ?? "pending_payment")

  const advanceAmount =
    project.project_value && project.advance_percent
      ? Math.round((project.project_value * project.advance_percent) / 100)
      : null

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !paymentRequest) return
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadPaymentScreenshot(paymentRequest.id, projectId, "advance", formData)
    setUploading(false)
    if (result?.error) {
      setError(result.error)
    } else if (result) {
      setLocalStatus("submitted")
      router.refresh()
    }
  }

  const canProceed = localStatus === "approved"

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Advance Payment</h2>
      <p className="wizard-step-subtitle">
        To kick off your project, please pay the advance amount via UPI or bank transfer below.
      </p>

      {/* Amount due */}
      <div className="payment-amount-card">
        <div className="payment-amount-row">
          <span className="payment-amount-label">Total Project Value</span>
          <span className="payment-amount-value">
            {project.project_value ? formatCurrency(project.project_value) : "—"}
          </span>
        </div>
        <div className="payment-amount-row payment-advance-row">
          <span className="payment-amount-label">Advance Due ({project.advance_percent ?? 50}%)</span>
          <span className="payment-amount-highlight">
            {advanceAmount ? formatCurrency(advanceAmount) : "—"}
          </span>
        </div>
      </div>

      {/* Bank / UPI details */}
      {bankSettings ? (
        <div className="payment-bank-card glass-frost">
          <div className="payment-bank-left">
            {bankSettings.qr_image_url && (
              <img
                src={bankSettings.qr_image_url}
                alt="UPI QR Code"
                className="payment-qr-image"
              />
            )}
            {bankSettings.upi_id && (
              <div className="payment-upi-id">
                <span className="payment-upi-label">UPI ID</span>
                <code className="payment-upi-value">{bankSettings.upi_id}</code>
              </div>
            )}
          </div>
          <div className="payment-bank-right">
            {bankSettings.bank_name && (
              <div className="payment-bank-row">
                <span className="payment-bank-label">Bank</span>
                <span>{bankSettings.bank_name}</span>
              </div>
            )}
            {bankSettings.account_holder && (
              <div className="payment-bank-row">
                <span className="payment-bank-label">Account Holder</span>
                <span>{bankSettings.account_holder}</span>
              </div>
            )}
            {bankSettings.account_number && (
              <div className="payment-bank-row">
                <span className="payment-bank-label">Account Number</span>
                <code>{bankSettings.account_number}</code>
              </div>
            )}
            {bankSettings.ifsc && (
              <div className="payment-bank-row">
                <span className="payment-bank-label">IFSC</span>
                <code>{bankSettings.ifsc}</code>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="info-banner">
          Payment details will be shared by the WebbHeads team shortly.
        </div>
      )}

      {/* Screenshot upload + status */}
      <div className="payment-upload-section">
        {localStatus === "pending_payment" && (
          <>
            <h3 className="payment-upload-title">Upload payment screenshot</h3>
            <p className="payment-upload-hint">
              After completing the payment, upload a screenshot as proof.
            </p>
            <label className="file-upload-area" id="payment-screenshot-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                disabled={uploading}
                className="file-upload-input"
              />
              {uploading ? (
                <span>Uploading…</span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span>Click to upload payment screenshot</span>
                </span>
              )}
            </label>
          </>
        )}

        {localStatus === "submitted" && (
          <div className="payment-status-card payment-status-submitted flex items-start gap-4">
            <div className="flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 animate-pulse">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <strong>Thank you! We&apos;re verifying your payment.</strong>
              <p className="text-muted-foreground mt-0.5">We&apos;ll update you within 1–2 hours.</p>
            </div>
          </div>
        )}

        {localStatus === "rejected" && (
          <div className="payment-status-card payment-status-rejected flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <strong>Payment rejected</strong>
                {paymentRequest?.rejection_reason && (
                  <p className="text-muted-foreground mt-0.5">Reason: {paymentRequest.rejection_reason}</p>
                )}
                <p className="text-muted-foreground mt-0.5">Please re-upload a clear screenshot.</p>
              </div>
            </div>
            <label className="file-upload-area file-upload-area-sm" id="payment-reupload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                disabled={uploading}
                className="file-upload-input"
              />
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Re-upload screenshot"}
              </span>
            </label>
          </div>
        )}

        {localStatus === "approved" && (
          <div className="payment-status-card payment-status-approved flex items-start gap-4">
            <div className="flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <strong>Payment approved!</strong>
              <p className="text-muted-foreground mt-0.5">Your advance payment has been confirmed. You can now proceed.</p>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-banner mt-4">{error}</div>}

      <div className="wizard-step-actions mt-8">
        <button
          disabled={!canProceed}
          className="btn-primary btn-large flex items-center justify-center gap-2 mx-auto"
          id="payment-next-btn"
          onClick={() => router.refresh()}
        >
          <span>Next: Profile Handover</span>
          <ArrowRight className="h-4 w-4" />
        </button>
        {!canProceed && localStatus !== "submitted" && (
          <p className="wizard-step-hint text-center mt-2">
            Payment must be approved by our team before you can continue.
          </p>
        )}
      </div>
    </div>
  )
}
