"use client"

import type { FormResponse } from "@/types"

interface FormResponsesTabProps {
  responses: FormResponse[]
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Short text",
  textarea: "Long text",
  file: "File upload",
  url: "URL",
  checkbox: "Checkbox",
}

export function FormResponsesTab({ responses }: FormResponsesTabProps) {
  if (responses.length === 0) {
    return (
      <div className="tab-panel">
        <div className="dashboard-empty-state">
          <p>No form responses submitted yet.</p>
          <span className="dashboard-empty-hint">
            Responses will appear here after the client completes Step 4 (Profile Handover).
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <div className="form-responses-list">
        {responses.map((response) => (
          <div key={response.id} className="form-response-item">
            <div className="form-response-label">
              {response.template?.label ?? "Unknown Field"}
              {response.template?.field_type && (
                <span className="badge badge-gray ml-2">
                  {FIELD_TYPE_LABELS[response.template.field_type] ?? response.template.field_type}
                </span>
              )}
              {response.template?.scope && (
                <span className={`badge ml-1 ${
                  response.template.scope === "general" ? "badge-blue" :
                  response.template.scope === "tech" ? "badge-purple" :
                  "badge-orange"
                }`}>
                  {response.template.scope}
                </span>
              )}
            </div>
            <div className="form-response-value">
              {!response.value ? (
                <em className="text-muted">No response</em>
              ) : response.template?.field_type === "file" ? (
                <a
                  href={response.value}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                >
                  View uploaded file ↗
                </a>
              ) : response.template?.field_type === "url" ? (
                <a
                  href={response.value}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                >
                  {response.value}
                </a>
              ) : response.template?.field_type === "checkbox" ? (
                <span className={response.value === "true" ? "badge-success" : "badge-pending"}>
                  {response.value === "true" ? "Yes" : "No"}
                </span>
              ) : (
                <span className="form-response-text">{response.value}</span>
              )}
            </div>
            <div className="form-response-date">
              Submitted {new Date(response.submitted_at).toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
