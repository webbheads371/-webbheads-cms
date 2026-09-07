"use client"

import { useState, useTransition } from "react"
import {
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
} from "@/lib/actions/admin-portal-actions"
import type { FormTemplate, FormScope, FormFieldType } from "@/types"

interface FormBuilderClientProps {
  initialTemplates: FormTemplate[]
}

const SCOPE_LABELS: Record<FormScope, string> = {
  general: "General (all clients)",
  tech: "Tech clients only",
  content: "Content clients only",
}

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  file: "File upload",
  url: "URL",
  checkbox: "Checkbox (Yes/No)",
}

const BADGE_COLORS: Record<FormScope, string> = {
  general: "badge-blue",
  tech: "badge-purple",
  content: "badge-orange",
}

interface TemplateFormState {
  label: string
  scope: FormScope
  field_type: FormFieldType
  is_required: boolean
  sort_order: number
}

const DEFAULT_FORM: TemplateFormState = {
  label: "",
  scope: "general",
  field_type: "text",
  is_required: true,
  sort_order: 0,
}

interface TemplateFormProps {
  formState: TemplateFormState
  setFormState: React.Dispatch<React.SetStateAction<TemplateFormState>>
  isPending: boolean
  onSave: () => void
  onCancel: () => void
}

function TemplateForm({
  formState,
  setFormState,
  isPending,
  onSave,
  onCancel,
}: TemplateFormProps) {
  return (
    <div className="form-template-edit-card">
      <div className="form-grid-2col">
        <div className="form-field form-field-span2">
          <label className="form-label">Question Label *</label>
          <input
            type="text"
            value={formState.label}
            onChange={(e) => setFormState((s) => ({ ...s, label: e.target.value }))}
            className="form-input"
            placeholder="e.g. Instagram handle"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Scope</label>
          <select
            value={formState.scope}
            onChange={(e) => setFormState((s) => ({ ...s, scope: e.target.value as FormScope }))}
            className="form-select"
          >
            {(Object.keys(SCOPE_LABELS) as FormScope[]).map((k) => (
              <option key={k} value={k}>{SCOPE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Field Type</label>
          <select
            value={formState.field_type}
            onChange={(e) => setFormState((s) => ({ ...s, field_type: e.target.value as FormFieldType }))}
            className="form-select"
          >
            {(Object.keys(FIELD_TYPE_LABELS) as FormFieldType[]).map((k) => (
              <option key={k} value={k}>{FIELD_TYPE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Sort Order</label>
          <input
            type="number"
            value={formState.sort_order}
            onChange={(e) => setFormState((s) => ({ ...s, sort_order: Number(e.target.value) }))}
            className="form-input"
            min={0}
          />
        </div>
        <div className="form-field form-checkbox-inline">
          <input
            type="checkbox"
            id="is-required-cb"
            checked={formState.is_required}
            onChange={(e) => setFormState((s) => ({ ...s, is_required: e.target.checked }))}
            className="form-checkbox"
          />
          <label htmlFor="is-required-cb" className="form-label">Required</label>
        </div>
      </div>
      <div className="form-actions">
        <button onClick={onSave} disabled={isPending || !formState.label.trim()} className="btn-primary">
          {isPending ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </div>
  )
}

export function FormBuilderClient({ initialTemplates }: FormBuilderClientProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<TemplateFormState>(DEFAULT_FORM)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const startEdit = (template: FormTemplate) => {
    setEditingId(template.id)
    setFormState({
      label: template.label,
      scope: template.scope,
      field_type: template.field_type,
      is_required: template.is_required,
      sort_order: template.sort_order,
    })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormState(DEFAULT_FORM)
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append("label", formState.label)
    fd.append("scope", formState.scope)
    fd.append("field_type", formState.field_type)
    fd.append("is_required", String(formState.is_required))
    fd.append("sort_order", String(formState.sort_order))
    return fd
  }

  const handleAdd = () => {
    if (!formState.label.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createFormTemplate(buildFormData())
      if (result.error) {
        setError(result.error)
      } else {
        setShowAddForm(false)
        setFormState(DEFAULT_FORM)
        window.location.reload()
      }
    })
  }

  const handleUpdate = (id: string) => {
    if (!formState.label.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await updateFormTemplate(id, buildFormData())
      if (result.error) {
        setError(result.error)
      } else {
        setEditingId(null)
        window.location.reload()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this question? This cannot be undone.")) return
    startTransition(async () => {
      const result = await deleteFormTemplate(id)
      if (result.error) {
        setError(result.error)
      } else {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      }
    })
  }

  return (
    <div className="settings-card">
      {error && <div className="error-banner">{error}</div>}

      {/* Template list */}
      {templates.length === 0 && !showAddForm && (
        <div className="dashboard-empty-state">
          <p>No form questions yet. Add your first question below.</p>
        </div>
      )}

      <div className="form-templates-list">
        {templates.map((template) => (
          <div key={template.id}>
            {editingId === template.id ? (
              <TemplateForm
                formState={formState}
                setFormState={setFormState}
                isPending={isPending}
                onSave={() => handleUpdate(template.id)}
                onCancel={cancelEdit}
              />
            ) : (
              <div className="form-template-row">
                <div className="form-template-row-left">
                  <span className="form-template-sort">{template.sort_order}</span>
                  <div className="form-template-info">
                    <span className="form-template-label">{template.label}</span>
                    <div className="form-template-meta">
                      <span className={`badge ${BADGE_COLORS[template.scope]}`}>
                        {SCOPE_LABELS[template.scope]}
                      </span>
                      <span className="badge badge-gray">{FIELD_TYPE_LABELS[template.field_type]}</span>
                      {template.is_required && <span className="badge badge-red">Required</span>}
                    </div>
                  </div>
                </div>
                <div className="form-template-row-actions">
                  <button
                    onClick={() => startEdit(template)}
                    className="btn-ghost btn-sm"
                    id={`edit-template-${template.id}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="btn-danger btn-sm"
                    id={`delete-template-${template.id}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      {showAddForm ? (
        <TemplateForm
          formState={formState}
          setFormState={setFormState}
          isPending={isPending}
          onSave={handleAdd}
          onCancel={cancelEdit}
        />
      ) : (
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null) }}
          className="btn-secondary"
          id="add-form-template-btn"
        >
          + Add Question
        </button>
      )}
    </div>
  )
}
