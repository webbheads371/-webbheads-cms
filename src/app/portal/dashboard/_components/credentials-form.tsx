"use client"

import { useState, useTransition } from "react"
import { submitProfileForm, uploadFormFile } from "@/lib/supabase/portal-actions"
import type { FormTemplate, FormResponse } from "@/types"
import { CheckCircle2, Paperclip } from "lucide-react"

interface CredentialsFormProps {
  projectId: string
  templates: FormTemplate[]
  existingResponses: FormResponse[]
}

export function CredentialsForm({ projectId, templates, existingResponses }: CredentialsFormProps) {
  const initialValues = Object.fromEntries(
    existingResponses.map((r) => [r.template_id, r.value ?? ""])
  )
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [fileUploading, setFileUploading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Check required fields
    const missing = templates.filter((t) => t.is_required && !values[t.id])
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.map(m => m.label).join(", ")}`)
      return
    }

    startTransition(async () => {
      const responses = templates.map((t) => ({
        template_id: t.id,
        value: values[t.id] ?? "",
      }))
      const result = await submitProfileForm(projectId, responses)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="credentials-card-container">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Update Onboarding Credentials</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Keep your brand profile and project credentials up to date. The team will be notified of any changes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
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
                  <div className="form-file-uploaded flex items-center gap-2">
                    <span className="badge-success flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> File uploaded
                    </span>
                    <a href={values[template.id]} target="_blank" rel="noreferrer" className="link ml-2 text-sm font-semibold">
                      View file
                    </a>
                    <button
                      type="button"
                      onClick={() => setValue(template.id, "")}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors ml-4 font-semibold"
                    >
                      Delete
                    </button>
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
                      <span className="flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                        <span>Click to upload file</span>
                      </span>
                    )}
                  </label>
                )}
              </div>
            )}
          </div>
        ))}

        {error && <div className="error-banner mt-4">{error}</div>}
        {success && (
          <div className="success-banner mt-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            Credentials updated successfully!
          </div>
        )}

        <div className="form-actions mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary btn-large"
            id="credentials-save-btn"
          >
            {isPending ? "Saving changes…" : "Save Credentials"}
          </button>
        </div>
      </form>
    </div>
  )
}
