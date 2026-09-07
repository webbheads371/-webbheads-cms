"use client"

import { useState } from "react"
import { uploadPaymentScreenshot } from "@/lib/actions/portal-actions"
import type { BankSettings, PaymentRequest } from "@/types"
import { Receipt, Upload, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"

interface FinalInvoiceSectionProps {
  projectId: string
  paymentRequest: PaymentRequest
  bankSettings: BankSettings | null
}

export function FinalInvoiceSection({ projectId, paymentRequest, bankSettings }: FinalInvoiceSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState(paymentRequest.status)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append("file", file)
    const result = await uploadPaymentScreenshot(paymentRequest.id, projectId, "final", formData)
    setUploading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setStatus("submitted")
    }
  }

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" />
        Final Invoice
      </h2>
      {status !== "approved" && (
        <div className="payment-amount-card">
          <div className="payment-amount-row payment-advance-row">
            <span className="payment-amount-label">Remaining Balance</span>
            <span className="payment-amount-highlight">{formatCurrency(paymentRequest.amount)}</span>
          </div>
        </div>
      )}

      {bankSettings && status !== "approved" && (
        <div className="payment-bank-card">
          <div className="payment-bank-left">
            {bankSettings.qr_image_url && (
              <img src={bankSettings.qr_image_url} alt="UPI QR Code" className="payment-qr-image" />
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
      )}

      {status === "pending_payment" && (
        <label className="file-upload-area mt-4" id="final-payment-screenshot-label">
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
            <span className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              Upload payment screenshot
            </span>
          )}
        </label>
      )}

      {status === "submitted" && (
        <div className="payment-status-card payment-status-submitted flex items-start gap-4">
          <div className="flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <strong>Thank you! We&apos;re verifying your payment.</strong>
            <p className="text-muted-foreground mt-0.5">We&apos;ll update you within 1–2 hours.</p>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="payment-status-card payment-status-rejected flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <strong>Payment rejected</strong>
              {paymentRequest.rejection_reason && <p className="text-muted-foreground mt-0.5">Reason: {paymentRequest.rejection_reason}</p>}
            </div>
          </div>
          <label className="file-upload-area file-upload-area-sm" id="final-reupload-label">
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

      {status === "approved" && (
        <div className="payment-status-card payment-status-approved flex items-start gap-4">
          <div className="flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <strong>Final payment confirmed!</strong>
            <p className="text-muted-foreground mt-0.5">Thank you — your project is complete.</p>
          </div>
        </div>
      )}

      {error && <div className="error-banner mt-4">{error}</div>}
    </div>
  )
}
