"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useSupabase } from "@/hooks/use-supabase"

interface Props {
  clients: { id: string; company_name: string }[]
  staff: { id: string; full_name: string; role: string }[]
  preselectedClientId?: string
}

export function NewProjectForm({ clients, staff, preselectedClientId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useSupabase()

  const techLeads = staff.filter((s) => s.role === "tech_lead")
  const contentLeads = staff.filter((s) => s.role === "content_lead")
  const salesLeads = staff.filter((s) => s.role === "sales")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      client_id: formData.get("client_id") as string,
      name: formData.get("name") as string,
      tech_lead_id: (formData.get("tech_lead_id") as string) || null,
      content_lead_id: (formData.get("content_lead_id") as string) || null,
      sales_lead_id: (formData.get("sales_lead_id") as string) || null,
      project_value: formData.get("project_value")
        ? Number(formData.get("project_value"))
        : null,
      expected_close_date: (formData.get("expected_close_date") as string) || null,
    }

    if (!data.client_id || !data.name) {
      setError("Client and project name are required")
      setLoading(false)
      return
    }

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert(data)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    if (project) {
      const { data: templates } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("stage_key", "quotation")

      if (templates) {
        const items = templates.map((t) => ({
          project_id: project.id,
          template_id: t.id,
          stage_key: t.stage_key,
          label: t.label,
          category: t.category,
          is_required: t.is_required,
          is_done: false,
        }))
        await supabase.from("project_checklist_items").insert(items)
      }

      await supabase.from("activity_log").insert({
        project_id: project.id,
        action: "stage_changed",
        detail: { new_stage: "quotation" },
      })
    }

    router.push(`/projects/${project?.id}`)
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Project" description="Create a new project pipeline" />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select name="client_id" defaultValue={preselectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" name="name" placeholder="e.g. Website Redesign - ABC Traders" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tech_lead_id">Tech Lead</Label>
                <Select name="tech_lead_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Assign tech lead" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select name="content_lead_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Assign content lead" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select name="sales_lead_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Assign sales lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesLeads.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_value">Project Value (INR)</Label>
                <Input id="project_value" name="project_value" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input id="expected_close_date" name="expected_close_date" type="date" />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
