"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useSupabase } from "@/hooks/use-supabase"
import type { Project, Staff } from "@/types"

interface Props {
  project: Project & { client: any }
  staff: Staff[]
}

export function EditDetailsTab({ project, staff }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = useSupabase()

  const techLeads = staff.filter((s) => s.role === "tech_lead")
  const contentLeads = staff.filter((s) => s.role === "content_lead")
  const salesLeads = staff.filter((s) => s.role === "sales")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    
    // Project updates
    const projectData = {
      name: formData.get("name") as string,
      tech_lead_id: formData.get("tech_lead_id") === "none" ? null : (formData.get("tech_lead_id") as string) || null,
      content_lead_id: formData.get("content_lead_id") === "none" ? null : (formData.get("content_lead_id") as string) || null,
      sales_lead_id: formData.get("sales_lead_id") === "none" ? null : (formData.get("sales_lead_id") as string) || null,
      project_value: formData.get("project_value")
        ? Number(formData.get("project_value"))
        : null,
      expected_close_date: (formData.get("expected_close_date") as string) || null,
    }

    // Client updates
    const clientData = {
      company_name: formData.get("company_name") as string,
      contact_name: formData.get("contact_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    }

    if (!projectData.name || !clientData.company_name) {
      setError("Project name and Client company name are required")
      setLoading(false)
      return
    }

    // Update Project
    const { error: projectError } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", project.id)

    if (projectError) {
      setError(projectError.message)
      setLoading(false)
      return
    }

    // Update Client
    if (project.client_id) {
      const { error: clientError } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", project.client_id)

      if (clientError) {
        setError(clientError.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Project & Client Details</CardTitle>
        <CardDescription>Update the information for this project and its associated client.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium leading-none">Project Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" defaultValue={project.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_value">Project Value (INR)</Label>
                <Input id="project_value" name="project_value" type="number" defaultValue={project.project_value || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input id="expected_close_date" name="expected_close_date" type="date" defaultValue={project.expected_close_date || ""} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tech_lead_id">Tech Lead</Label>
                <Select name="tech_lead_id" defaultValue={project.tech_lead_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign tech lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {techLeads.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content_lead_id">Content Lead</Label>
                <Select name="content_lead_id" defaultValue={project.content_lead_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign content lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {contentLeads.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_lead_id">Sales Lead</Label>
                <Select name="sales_lead_id" defaultValue={project.sales_lead_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign sales lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {salesLeads.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium leading-none">Client Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input id="company_name" name="company_name" defaultValue={project.client?.company_name || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input id="contact_name" name="contact_name" defaultValue={project.client?.contact_name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={project.client?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone / Mobile</Label>
                <Input id="phone" name="phone" defaultValue={project.client?.phone || ""} />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {success && <p className="text-sm text-emerald-600 font-medium">Details updated successfully!</p>}

          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
