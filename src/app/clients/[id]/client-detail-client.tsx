"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { formatDate } from "@/lib/utils"
import { Plus, ExternalLink, Key, RefreshCw } from "lucide-react"
import { generateClientPortalLogin, updateClientType, resetClientPortalPassword } from "@/lib/supabase/admin-portal-actions"
import type { Client, Project, Staff, ClientUser } from "@/types"

interface Props {
  client: Client & { client_users?: ClientUser[] }
  projects: (Project & { tech_lead: Staff | null; content_lead: Staff | null })[]
}

export function ClientDetailClient({ client, projects }: Props) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [typeUpdating, setTypeUpdating] = useState(false)

  const hasPortalLogin = (client.client_users?.length ?? 0) > 0

  const handleGenerateLogin = async () => {
    if (!client.email) {
      setPortalError("Client must have an email address to generate a login.")
      return
    }
    const fullName = client.contact_name || client.company_name
    setIsGenerating(true)
    setPortalError(null)

    const result = await generateClientPortalLogin(client.id, fullName, client.email)
    setIsGenerating(false)

    if (result.error) {
      setPortalError(result.error)
    } else if (result.credentials) {
      setCredentials(result.credentials)
    }
  }

  const handleTypeChange = async (newType: string) => {
    setTypeUpdating(true)
    await updateClientType(client.id, newType)
    setTypeUpdating(false)
  }

  const handleResetPassword = async () => {
    if (!confirm("Are you sure you want to reset the client's password? The current password will no longer work.")) return
    
    setIsGenerating(true)
    setPortalError(null)

    const userId = client.client_users?.[0]?.id
    if (!userId) return

    const result = await resetClientPortalPassword(userId)
    setIsGenerating(false)

    if (result.error) {
      setPortalError(result.error)
    } else if (result.credentials) {
      setCredentials(result.credentials)
    }
  }

  return (
    <div>
      <PageHeader title={client.company_name} description="Client details and projects">
        <Button onClick={() => router.push(`/projects/new?client_id=${client.id}`)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {client.contact_name || "—"}</p>
            <p><span className="text-muted-foreground">Email:</span> {client.email || "—"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {client.phone || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm"><span className="text-muted-foreground">Source:</span> {client.source || "—"}</p>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Client Type</span>
              <select
                value={client.client_type}
                onChange={(e) => handleTypeChange(e.target.value)}
                disabled={typeUpdating}
                className="text-sm border rounded p-1 w-full max-w-[120px]"
              >
                <option value="tech">Tech</option>
                <option value="content">Content</option>
                <option value="both">Both</option>
              </select>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="h-4 w-4" /> Portal Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credentials ? (
              <div className="text-sm space-y-2 bg-accent/30 p-3 rounded-md border">
                <p className="font-semibold text-green-600">Login Generated Successfully!</p>
                <p>Share these credentials with the client securely:</p>
                <div className="font-mono text-xs bg-background p-2 rounded border">
                  <div>Email: {credentials.email}</div>
                  <div>Temp Password: {credentials.tempPassword}</div>
                </div>
                <p className="text-xs text-muted-foreground">The client will be prompted to change their password on first login.</p>
              </div>
            ) : hasPortalLogin ? (
              <div className="space-y-4">
                <div className="text-sm flex items-center justify-between gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">✓</span>
                    <div>
                      <strong>Portal login active</strong>
                      <p className="text-xs mt-0.5">Linked to {client.client_users?.[0]?.email}</p>
                    </div>
                  </div>
                  <Button onClick={handleResetPassword} disabled={isGenerating} size="sm" variant="outline" className="text-foreground">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
                {portalError && <p className="text-xs text-destructive mt-2">{portalError}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate a dedicated portal login for this client to view their project status, make payments, and submit forms.
                </p>
                <Button onClick={handleGenerateLogin} disabled={isGenerating} size="sm" variant="secondary">
                  {isGenerating ? "Generating..." : "Generate Portal Login"}
                </Button>
                {portalError && <p className="text-xs text-destructive mt-2">{portalError}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{project.name}</p>
                    <Badge variant="outline" className="capitalize">
                      {project.current_stage.replace(/_/g, " ")}
                    </Badge>
                    {project.status !== "active" && (
                      <Badge
                        variant={project.status === "closed_won" ? "default" : "destructive"}
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    {project.tech_lead && <span>Tech: {project.tech_lead.full_name}</span>}
                    {project.content_lead && <span>Content: {project.content_lead.full_name}</span>}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No projects for this client yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
