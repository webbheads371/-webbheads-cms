"use client"

import { useState } from "react"
import { updateClientPassword } from "@/lib/supabase/portal-actions"
import { Lock, Eye, EyeOff } from "lucide-react"

export function ChangePasswordForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
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
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
      >
        <Lock className="h-3 w-3" />
        Change Password
      </button>
    )
  }

  return (
    <div className="bg-card border rounded-md p-4 shadow-sm w-full max-w-sm">
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
