"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { createChecklistTemplate, deleteChecklistTemplate } from "@/lib/actions/admin-portal-actions"
import { Plus, Trash2 } from "lucide-react"
import type { PipelineStage, ChecklistTemplate } from "@/types"

interface Props {
  stages: PipelineStage[]
  templates: ChecklistTemplate[]
}

export function SettingsClient({ stages, templates }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAddTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await createChecklistTemplate(formData)
    if (!res.error) {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteChecklistTemplate(id)
    if (!res.error) {
      router.refresh()
    }
  }

  const grouped = stages.reduce((acc, stage) => {
    acc[stage.key] = {
      stage,
      items: templates.filter((t) => t.stage_key === stage.key),
    }
    return acc
  }, {} as Record<string, { stage: PipelineStage; items: ChecklistTemplate[] }>)

  return (
    <div>
      <PageHeader title="Settings" description="Manage checklist templates per stage">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Checklist Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Checklist Template Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTemplate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stage_key">Stage *</Label>
                <Select name="stage_key" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input id="label" name="label" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="is_required" name="is_required" defaultChecked />
                <Label htmlFor="is_required">Required</Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-6">
        {Object.entries(grouped).map(([key, { stage, items }]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {stage.label}
                <Badge variant="secondary">{items.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checklist items for this stage.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            item.category === "tech"
                              ? "bg-blue-100 text-blue-800"
                              : item.category === "content"
                              ? "bg-green-100 text-green-800"
                              : item.category === "sales"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-purple-100 text-purple-800"
                          }
                        >
                          {item.category}
                        </Badge>
                        <span className="text-sm">{item.label}</span>
                        {item.is_required && (
                          <span className="text-xs text-destructive">*required</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
