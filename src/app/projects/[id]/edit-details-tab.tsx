"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updateProjectDetailsAction } from "@/lib/supabase/actions"
import type { Project, Staff } from "@/types"

interface EditDetailsTabProps {
  project: Project
  staffList: Staff[]
}

export function EditDetailsTab({ project, staffList }: EditDetailsTabProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const techLeads = staffList.filter((s) => s.role === "tech_lead" || s.role === "admin")
  const contentLeads = staffList.filter((s) => s.role === "content_lead" || s.role === "admin")
  const salesLeads = staffList.filter((s) => s.role === "sales" || s.role === "admin")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const res = await updateProjectDetailsAction(project.id, project.client_id, formData)

    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Project & Client Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {success && <p className="text-sm text-green-600 font-medium">Details updated successfully!</p>}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" defaultValue={project.name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_value">Project Value (₹)</Label>
                <Input
                  id="project_value"
                  name="project_value"
                  type="number"
                  defaultValue={project.project_value ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advance_percent">Advance Payment (%)</Label>
                <Input
                  id="advance_percent"
                  name="advance_percent"
                  type="number"
                  defaultValue={project.advance_percent ?? 50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech_lead_id">Tech Lead</Label>
                <select
                  id="tech_lead_id"
                  name="tech_lead_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={project.tech_lead_id ?? ""}
                >
                  <option value="">None Assigned</option>
                  {techLeads.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_lead_id">Content Lead</Label>
                <select
                  id="content_lead_id"
                  name="content_lead_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={project.content_lead_id ?? ""}
                >
                  <option value="">None Assigned</option>
                  {contentLeads.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sales_lead_id">Sales Lead</Label>
                <select
                  id="sales_lead_id"
                  name="sales_lead_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={project.sales_lead_id ?? ""}
                >
                  <option value="">None Assigned</option>
                  {salesLeads.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={project.client?.company_name ?? ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Person</Label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  defaultValue={project.client?.contact_name ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={project.client?.email ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={project.client?.phone ?? ""}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
