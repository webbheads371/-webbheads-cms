"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { formatDate } from "@/lib/utils"
import { Plus, Key, RefreshCw, Eye, EyeOff, Copy, Check, ShieldAlert } from "lucide-react"
import { resetStaffPassword } from "@/lib/supabase/admin-portal-actions"
import type { Staff } from "@/types"

interface Props {
  staff: Staff[]
  projects: { id: string; name: string; client_id: string }[]
  clients: { id: string; company_name: string }[]
}

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50",
  tech_lead: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50",
  content_lead: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/50",
  sales: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50",
}

// ─── Password Reset Modal (per staff row) ──────────────────────────────────────
function ResetPasswordModal({ member }: { member: Staff }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<{ email: string; fullName: string; tempPassword: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleReset() {
    setLoading(true)
    setError(null)
    const result = await resetStaffPassword(member.id)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else if (result.credentials) {
      setCredentials(result.credentials)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setOpen(false)
    setCredentials(null)
    setError(null)
    setShowPassword(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Password
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Reset Password — {member.full_name}
          </DialogTitle>
          <DialogDescription>
            Generate a new temporary password for this staff member. The old password will immediately stop working.
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md text-sm text-green-800 dark:text-green-300 font-medium">
              Password reset successfully! Share these credentials securely.
            </div>
            <div className="bg-muted/40 border rounded-md p-3 space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans mb-0.5">Email</p>
                  <p className="font-medium">{credentials.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(credentials.email)}
                  className="h-7 w-7 p-0 flex-shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans mb-0.5">New Password</p>
                  <p className="font-medium tracking-wider">
                    {showPassword ? credentials.tempPassword : "•".repeat(credentials.tempPassword.length)}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-7 w-7 p-0"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(credentials.tempPassword)}
                    className="h-7 w-7 p-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ask the staff member to change this password after their next login.
            </p>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md text-sm text-amber-800 dark:text-amber-300 flex gap-2">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                <strong>{member.full_name}</strong> ({member.email}) will immediately lose access with their current password.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleReset} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? "Resetting..." : "Confirm Reset"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Staff Client ─────────────────────────────────────────────────────────
export function StaffClient({ staff, projects, clients }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const router = useRouter()

  function handleGeneratePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let pass = ""
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
  }

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    )
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  async function handleCreateStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const fullName = formData.get("full_name") as string
    const role = formData.get("role") as string

    if (!password) {
      setError("Password is required")
      setLoading(false)
      return
    }

    const res = await fetch("/api/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        fullName,
        role,
        password,
        projectIds: selectedProjects,
        clientIds: selectedClients,
      }),
    })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setLoading(false)
      return
    }

    setPassword("")
    setSelectedClients([])
    setSelectedProjects([])
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  async function handleRoleChange(staffId: string, newRole: string) {
    await fetch("/api/staff/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, role: newRole }),
    })
    router.refresh()
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch("/api/staff/sync", { method: "POST" })
    const data = await res.json()
    setSyncing(false)
    if (data.error) {
      setSyncResult(`Error: ${data.error}`)
    } else {
      setSyncResult(data.message)
      if (data.synced > 0) router.refresh()
    }
  }

  return (
    <div>
      <PageHeader title="Staff Management" description="Admin-only: manage team accounts and assignments">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing} size="sm">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Records'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a credentials account directly and assign them to initial clients or projects.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" name="full_name" required placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      name="password"
                      type={showNewPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter or generate password"
                      className="font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleGeneratePassword} className="flex gap-1.5 items-center flex-shrink-0">
                    <Key className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="tech_lead">Tech Lead</SelectItem>
                    <SelectItem value="content_lead">Content Lead</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment: Clients */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assign to Clients</Label>
                <p className="text-[11px] text-muted-foreground -mt-1">
                  Assigning a client automatically links the staff to all their projects.
                </p>
                <div className="border rounded-md p-2.5 max-h-32 overflow-y-auto space-y-2 bg-muted/20">
                  {clients.map((client) => (
                    <div key={client.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`client-${client.id}`}
                        checked={selectedClients.includes(client.id)}
                        onChange={() => toggleClient(client.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor={`client-${client.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {client.company_name}
                      </label>
                    </div>
                  ))}
                  {clients.length === 0 && (
                    <p className="text-xs text-muted-foreground">No clients available</p>
                  )}
                </div>
              </div>

              {/* Assignment: Projects */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assign to Projects</Label>
                <div className="border rounded-md p-2.5 max-h-32 overflow-y-auto space-y-2 bg-muted/20">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor={`project-${project.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {project.name}
                      </label>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-xs text-muted-foreground">No projects available</p>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Staff Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </PageHeader>

      {syncResult && (
        <div className={`mb-4 px-4 py-2.5 rounded-md text-sm border ${syncResult.startsWith('Error') ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300'}`}>
          {syncResult}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Change Role</TableHead>
                <TableHead>Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[member.role]}>
                      {member.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="tech_lead">Tech Lead</SelectItem>
                        <SelectItem value="content_lead">Content Lead</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <ResetPasswordModal member={member} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
