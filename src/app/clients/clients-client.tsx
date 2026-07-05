"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { useSupabase } from "@/hooks/use-supabase"
import { formatDate } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

interface ClientWithProjects {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  source: string | null
  created_at: string
  projects: { count: number }[]
}

export function ClientsClient({ clients, role }: { clients: ClientWithProjects[], role: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useSupabase()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      company_name: formData.get("company_name") as string,
      contact_name: (formData.get("contact_name") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      source: (formData.get("source") as string) || null,
      client_type: formData.get("client_type") as string,
    }
    const { error } = await supabase.from("clients").insert(data)
    if (!error) {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader title="Clients" description="All your agency clients">
        {role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input id="company_name" name="company_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input id="contact_name" name="contact_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" name="source" placeholder="How they found us" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_type">Client Type *</Label>
                  <select
                    id="client_type"
                    name="client_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="both"
                  >
                    <option value="tech">Tech</option>
                    <option value="content">Content</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Client"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Created</TableHead>
              {role === "admin" && <TableHead>Delete</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <ClientRow key={client.id} client={client} role={role} onDeleted={() => router.refresh()} />
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No clients yet. Create your first client.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Single client row with inline delete ──────────────────────────────────────
function ClientRow({
  client,
  role,
  onDeleted,
}: {
  client: ClientWithProjects
  role: string
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation() // Prevent row click navigation
    setDeleting(true)
    setDeleteError(null)
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" })
    const data = await res.json()
    setDeleting(false)
    if (data.error) {
      setDeleteError(data.error)
    } else {
      setShowConfirm(false)
      onDeleted()
    }
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 group"
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      <TableCell className="font-medium">{client.company_name}</TableCell>
      <TableCell>{client.contact_name || "—"}</TableCell>
      <TableCell>{client.email || "—"}</TableCell>
      <TableCell>
        <Badge variant="secondary">{client.projects?.[0]?.count ?? 0}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(client.created_at)}
      </TableCell>
      {role === "admin" && (
        <TableCell>
          <div onClick={(e) => e.stopPropagation()}>
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" /> Delete Client
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to permanently delete <strong>{client.company_name}</strong>? 
                    This will remove their login access and all their projects.
                  </DialogDescription>
                </DialogHeader>
                {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
