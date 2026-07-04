"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { formatDate } from "@/lib/utils"
import { useSupabase } from "@/hooks/use-supabase"
import { Plus, RefreshCw, Key } from "lucide-react"
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

export function StaffClient({ staff, projects, clients }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // New States
  const [password, setPassword] = useState("")
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const router = useRouter()
  const supabase = useSupabase()

  // Generate random 12-char secure password
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

    // Reset fields on success
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

  return (
    <div>
      <PageHeader title="Staff Management" description="Admin-only: manage team accounts and assignments">
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
                  <Input
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter or generate password"
                    className="font-mono"
                  />
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
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[member.role]}>
                      {member.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="w-32">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
