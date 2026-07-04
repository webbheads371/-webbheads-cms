"use client"

import { useState, useTransition, useRef } from "react"
import { saveBankSettings } from "@/lib/supabase/admin-portal-actions"
import type { BankSettings } from "@/types"
import { Image as ImageIcon, CheckCircle2 } from "lucide-react"

interface BankSettingsClientProps {
  initialSettings: BankSettings | null
}

export function BankSettingsClient({ initialSettings }: BankSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(initialSettings?.qr_image_url ?? null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQrPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveBankSettings(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="settings-card">
      <form ref={formRef} onSubmit={handleSubmit} className="bank-settings-form">
        <div className="form-grid-2col">
          <div className="form-field">
            <label className="form-label" htmlFor="bank-upi-id">UPI ID</label>
            <input
              id="bank-upi-id"
              name="upi_id"
              type="text"
              defaultValue={settings?.upi_id ?? ""}
              className="form-input"
              placeholder="yourname@upi"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="bank-name">Bank Name</label>
            <input
              id="bank-name"
              name="bank_name"
              type="text"
              defaultValue={settings?.bank_name ?? ""}
              className="form-input"
              placeholder="e.g. HDFC Bank"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="bank-account-holder">Account Holder</label>
            <input
              id="bank-account-holder"
              name="account_holder"
              type="text"
              defaultValue={settings?.account_holder ?? ""}
              className="form-input"
              placeholder="Full name as per bank"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="bank-account-number">Account Number</label>
            <input
              id="bank-account-number"
              name="account_number"
              type="text"
              defaultValue={settings?.account_number ?? ""}
              className="form-input"
              placeholder="Account number"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="bank-ifsc">IFSC Code</label>
            <input
              id="bank-ifsc"
              name="ifsc"
              type="text"
              defaultValue={settings?.ifsc ?? ""}
              className="form-input"
              placeholder="e.g. HDFC0001234"
            />
          </div>
        </div>

        {/* QR Image */}
        <div className="form-field">
          <label className="form-label">UPI QR Code Image</label>
          <div className="qr-upload-row">
            {qrPreview && (
              <img src={qrPreview} alt="QR Code preview" className="qr-preview-img" />
            )}
            <label className="file-upload-area file-upload-area-sm" id="qr-upload-label">
              <input
                name="qr_image"
                type="file"
                accept="image/*"
                onChange={handleQrChange}
                className="file-upload-input"
              />
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span>{qrPreview ? "Replace QR image" : "Upload QR image"}</span>
              </span>
            </label>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && (
          <div className="success-banner flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Bank settings saved successfully!</span>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            id="bank-settings-save-btn"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  )
}
