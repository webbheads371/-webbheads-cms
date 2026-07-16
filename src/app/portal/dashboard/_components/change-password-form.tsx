"use client"

import { useState } from "react"
import { updateClientPassword } from "@/lib/supabase/portal-actions"
import { Lock, Eye, EyeOff } from "lucide-react"

export function ChangePasswordForm({ variant = "default" }: { variant?: "default" | "dropdown" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateClientPassword(password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setPassword("")
      setTimeout(() => setIsOpen(false), 2000)
    }
  }

  if (!isOpen) {
    if (variant === "dropdown") {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
        >
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">Change Password</span>
        </button>
      )
    }

    return (
    <button
      onClick={() => setIsOpen(true)}
      className="text-xs text-muted-foreground hover:text-[#D6A33C] flex items-center gap-1.5 transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:shadow-sm"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)' }}
    >
      <Lock className="h-3 w-3" />
      Change Password
    </button>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-4 w-full max-w-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" /> Change Password
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      {success ? (
        <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded">
          Password updated successfully!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full text-sm rounded-md border bg-background px-3 py-2 pr-9"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md transition-colors"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  )
}
