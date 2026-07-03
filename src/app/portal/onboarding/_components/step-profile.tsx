"use client"

import { useState, useTransition } from "react"
import { submitProfileForm, uploadFormFile } from "@/lib/supabase/portal-actions"
import type { FormTemplate, FormResponse } from "@/types"

interface StepProfileProps {
  projectId: string
  templates: FormTemplate[]
  existingResponses: FormResponse[]
}

export function StepProfile({ projectId, templates, existingResponses }: StepProfileProps) {
  const initialValues = Object.fromEntries(
    existingResponses.map((r) => [r.template_id, r.value ?? ""])
  )
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [fileUploading, setFileUploading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const setValue = (templateId: string, value: string) => {
    setValues((prev) => ({ ...prev, [templateId]: value }))
  }

  const handleFileUpload = async (templateId: string, file: File) => {
    setFileUploading((prev) => ({ ...prev, [templateId]: true }))
    const formData = new FormData()
    formData.append("file", file)
    const result = await uploadFormFile(projectId, templateId, formData)
    setFileUploading((prev) => ({ ...prev, [templateId]: false }))
    if (result.error) {
      setError(result.error)
    } else {
      setValue(templateId, result.url!)
    }
  }

  const allRequiredFilled = templates
    .filter((t) => t.is_required)
    .every((t) => {
      const val = values[t.id]
      return val !== undefined && val !== ""
    })

  const handleSubmit = () => {
    if (!allRequiredFilled) return
    setError(null)
    startTransition(async () => {
      const responses = templates.map((t) => ({
        template_id: t.id,
        value: values[t.id] ?? "",
      }))
      const result = await submitProfileForm(projectId, responses)
      if (result.error) {
        setError(result.error)
      } else {
        setSubmitted(true)
        // After submission, redirect to dashboard (server will handle via page.tsx)
        setTimeout(() => window.location.reload(), 1500)
      }
    })
  }

  if (submitted) {
    return (
      <div className="wizard-step-content wizard-step-success">
        <div className="success-icon">🎉</div>
        <h2 className="wizard-step-title">Thank you!</h2>
        <p className="wizard-step-subtitle">
          We&apos;ll review your details and share your project timeline shortly.
          Redirecting to your dashboard…
        </p>
      </div>
    )
  }

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Profile & Brand Handover</h2>
      <p className="wizard-step-subtitle">
        Please fill in the details below so our team can get started on your project.
      </p>

      <div className="profile-form">
        {templates.map((template) => (
          <div key={template.id} className="profile-form-field">
            <label className="profile-form-label" htmlFor={`field-${template.id}`}>
              {template.label}
              {template.is_required && <span className="required-star"> *</span>}
            </label>

            {template.field_type === "text" && (
              <input
                id={`field-${template.id}`}
                type="text"
                value={values[template.id] ?? ""}
                onChange={(e) => setValue(template.id, e.target.value)}
                className="form-input"
                placeholder={`Enter ${template.label.toLowerCase()}`}
              />
            )}

            {template.field_type === "textarea" && (
              <textarea
                id={`field-${template.id}`}
                value={values[template.id] ?? ""}
                onChange={(e) => setValue(template.id, e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder={`Enter ${template.label.toLowerCase()}`}
              />
            )}

            {template.field_type === "url" && (
              <input
                id={`field-${template.id}`}
                type="url"
                value={values[template.id] ?? ""}
                onChange={(e) => setValue(template.id, e.target.value)}
                className="form-input"
                placeholder="https://"
              />
            )}

            {template.field_type === "checkbox" && (
              <div className="form-checkbox-row">
                <input
                  id={`field-${template.id}`}
                  type="checkbox"
                  checked={values[template.id] === "true"}
                  onChange={(e) => setValue(template.id, e.target.checked ? "true" : "false")}
                  className="form-checkbox"
                />
                <label htmlFor={`field-${template.id}`} className="form-checkbox-label">
                  Yes
                </label>
              </div>
            )}

            {template.field_type === "file" && (
              <div>
                {values[template.id] ? (
                  <div className="form-file-uploaded">
                    <span className="badge-success">✓ File uploaded</span>
                    <a href={values[template.id]} target="_blank" rel="noreferrer" className="link">
                      View file
                    </a>
                  </div>
                ) : (
                  <label className="file-upload-area" id={`file-upload-${template.id}`}>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(template.id, file)
                      }}
                      disabled={fileUploading[template.id]}
                      className="file-upload-input"
                    />
                    {fileUploading[template.id] ? (
                      <span>Uploading…</span>
                    ) : (
                      <>
                        <span className="file-upload-icon">📎</span>
                        <span>Click to upload file</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="wizard-step-actions">
        <button
          onClick={handleSubmit}
          disabled={!allRequiredFilled || isPending}
          className="btn-primary btn-large"
          id="profile-submit-btn"
        >
          {isPending ? "Submitting…" : "Submit Profile →"}
        </button>
        {!allRequiredFilled && (
          <p className="wizard-step-hint">Please fill in all required fields to continue.</p>
        )}
      </div>
    </div>
  )
}
