"use client"

import { useState, useTransition } from "react"
import {
  createContentScheduleItem,
  updateContentScheduleItem,
  deleteContentScheduleItem,
  toggleContentSchedulePosted,
} from "@/lib/supabase/admin-portal-actions"
import type { ContentSchedule } from "@/types"
import { CalendarDays, Plus, Pencil, Trash2, CheckCircle2, Clock, X, Save } from "lucide-react"

interface ContentScheduleTabProps {
  projectId: string
  items: ContentSchedule[]
}

function formatDateTimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDisplay(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export function ContentScheduleTab({ projectId, items: initialItems }: ContentScheduleTabProps) {
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<ContentSchedule[]>(initialItems)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Add form state
  const [addName, setAddName] = useState("")
  const [addCaption, setAddCaption] = useState("")
  const [addDate, setAddDate] = useState("")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editCaption, setEditCaption] = useState("")
  const [editDate, setEditDate] = useState("")

  const handleAdd = () => {
    if (!addName.trim() || !addDate) return
    setError(null)
    startTransition(async () => {
      const result = await createContentScheduleItem(projectId, addName, addCaption, new Date(addDate).toISOString())
      if (result.error) {
        setError(result.error)
      } else {
        setItems(prev => [{
          id: crypto.randomUUID(),
          project_id: projectId,
          content_name: addName,
          caption: addCaption || null,
          scheduled_at: new Date(addDate).toISOString(),
          is_posted: false,
          posted_at: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_by: null,
          updated_at: new Date().toISOString(),
        }, ...prev])
        setAddName(""); setAddCaption(""); setAddDate("")
        setShowAddForm(false)
      }
    })
  }

  const startEdit = (item: ContentSchedule) => {
    setEditingId(item.id)
    setEditName(item.content_name)
    setEditCaption(item.caption || "")
    setEditDate(formatDateTimeLocal(item.scheduled_at))
  }

  const handleUpdate = (itemId: string) => {
    if (!editName.trim() || !editDate) return
    setError(null)
    startTransition(async () => {
      const result = await updateContentScheduleItem(itemId, projectId, editName, editCaption, new Date(editDate).toISOString())
      if (result.error) {
        setError(result.error)
      } else {
        setItems(prev => prev.map(i => i.id === itemId
          ? { ...i, content_name: editName, caption: editCaption || null, scheduled_at: new Date(editDate).toISOString(), updated_at: new Date().toISOString() }
          : i
        ))
        setEditingId(null)
      }
    })
  }

  const handleDelete = (itemId: string) => {
    if (!confirm("Delete this content item?")) return
    startTransition(async () => {
      const result = await deleteContentScheduleItem(itemId, projectId)
      if (result.error) setError(result.error)
      else setItems(prev => prev.filter(i => i.id !== itemId))
    })
  }

  const handleTogglePosted = (item: ContentSchedule) => {
    const newValue = !item.is_posted
    startTransition(async () => {
      const result = await toggleContentSchedulePosted(item.id, projectId, newValue)
      if (result.error) setError(result.error)
      else setItems(prev => prev.map(i => i.id === item.id
        ? { ...i, is_posted: newValue, posted_at: newValue ? new Date().toISOString() : null }
        : i
      ))
    })
  }

  return (
    <div className="tab-panel">
      {error && <div className="error-banner">{error}</div>}

      <div className="tab-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="tab-section-title flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            Content Schedule
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary btn-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-4 border border-amber-200 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">New Content Item</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="form-field">
                <label className="form-label">Content Name *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Product Launch Post"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Caption / Description</label>
                <input
                  type="text"
                  value={addCaption}
                  onChange={e => setAddCaption(e.target.value)}
                  className="form-input"
                  placeholder="Short caption for the post"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={addDate}
                  onChange={e => setAddDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={isPending || !addName.trim() || !addDate} className="btn-primary btn-sm flex items-center gap-1">
                <Save className="h-4 w-4" /> {isPending ? "Saving..." : "Save Item"}
              </button>
              <button onClick={() => setShowAddForm(false)} className="btn-secondary btn-sm flex items-center gap-1">
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic">
            No content scheduled yet. Click "Add Content" to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[...items].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).map(item => (
              <div key={item.id} className={`border rounded-xl p-4 transition-all duration-200 ${item.is_posted ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-white/5"}`}>
                {editingId === item.id ? (
                  /* Edit mode */
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="form-field">
                        <label className="form-label">Content Name *</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Caption / Description</label>
                        <input type="text" value={editCaption} onChange={e => setEditCaption(e.target.value)} className="form-input" />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Scheduled Date & Time *</label>
                        <input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} className="form-input" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(item.id)} disabled={isPending} className="btn-primary btn-sm flex items-center gap-1">
                        <Save className="h-4 w-4" /> {isPending ? "Saving..." : "Update"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary btn-sm flex items-center gap-1">
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 flex-shrink-0 ${item.is_posted ? "text-emerald-500" : "text-amber-400"}`}>
                        {item.is_posted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.content_name}</span>
                          {item.is_posted ? (
                            <span className="badge-success text-[11px]">✓ Posted</span>
                          ) : (
                            <span className="badge-pending text-[11px]">Scheduled</span>
                          )}
                        </div>
                        {item.caption && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.caption}</p>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDisplay(item.scheduled_at)}
                          {item.is_posted && item.posted_at && (
                            <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                              · Posted {formatDisplay(item.posted_at)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Mark as posted toggle */}
                      <button
                        onClick={() => handleTogglePosted(item)}
                        disabled={isPending}
                        title={item.is_posted ? "Mark as not posted" : "Mark as posted"}
                        className={`text-xs px-2 py-1 rounded-lg font-semibold border transition-all duration-200 ${item.is_posted ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" : "border-slate-300 text-slate-600 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:bg-white/5 dark:text-slate-400 dark:border-slate-700"}`}
                      >
                        {item.is_posted ? "✓ Posted" : "Mark Posted"}
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
