"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requestPasswordReset } from "@/lib/supabase/password-reset-actions"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    message: string
    resetLink?: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await requestPasswordReset(email)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setResult({
        message: res.message || "Password reset link generated successfully.",
        resetLink: res.resetLink,
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-black flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="WebbHeads Logo" className="h-11 w-11 object-contain" />
          </div>
          <CardTitle className="text-xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your registered email address and we'll generate a password reset link for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4 text-center py-2">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-foreground">{result.message}</p>
              {result.resetLink && (
                <div className="p-3 bg-muted/50 border rounded-md text-xs font-mono break-all text-left">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-sans uppercase mb-1 font-semibold">
                    Direct Reset Link (Dev/Testing Mode — TODO: Email Provider)
                  </p>
                  <Link href={result.resetLink} className="text-primary hover:underline font-bold">
                    {result.resetLink}
                  </Link>
                </div>
              )}
              <div className="pt-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Registered Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@webbheads.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Generating Link..." : "Request Reset Link"}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
