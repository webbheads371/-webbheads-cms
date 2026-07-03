"use client"

import { useState } from "react"
import { uploadPaymentScreenshot } from "@/lib/supabase/portal-actions"
import type { BankSettings, PaymentRequest } from "@/types"

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
      <h2 className="dashboard-section-title">🧾 Final Invoice</h2>
      <div className="payment-amount-card">
        <div className="payment-amount-row payment-advance-row">
          <span className="payment-amount-label">Remaining Balance</span>
          <span className="payment-amount-highlight">{formatCurrency(paymentRequest.amount)}</span>
        </div>
      </div>

      {bankSettings && (
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
        <label className="file-upload-area" id="final-payment-screenshot-label">
          <input
            type="file"
            accept="image/*"
            onChange={handleScreenshotUpload}
            disabled={uploading}
            className="file-upload-input"
          />
          {uploading ? "Uploading…" : "📤 Upload payment screenshot"}
        </label>
      )}

      {status === "submitted" && (
        <div className="payment-status-card payment-status-submitted">
          <span className="payment-status-icon">⏳</span>
          <div>
            <strong>Thank you! We&apos;re verifying your payment.</strong>
            <p>We&apos;ll update you within 1–2 hours.</p>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="payment-status-card payment-status-rejected">
          <span className="payment-status-icon">⚠️</span>
          <div>
            <strong>Payment rejected</strong>
            {paymentRequest.rejection_reason && <p>Reason: {paymentRequest.rejection_reason}</p>}
          </div>
          <label className="file-upload-area file-upload-area-sm" id="final-reupload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              disabled={uploading}
              className="file-upload-input"
            />
            {uploading ? "Uploading…" : "Re-upload screenshot"}
          </label>
        </div>
      )}

      {status === "approved" && (
        <div className="payment-status-card payment-status-approved">
          <span className="payment-status-icon">✅</span>
          <div>
            <strong>Final payment confirmed!</strong>
            <p>Thank you — your project is complete.</p>
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
    </div>
  )
}
