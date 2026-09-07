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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { uploadProjectDocument } from "@/lib/actions/admin-portal-actions"
import { Plus, ExternalLink } from "lucide-react"
import type { Document } from "@/types"

interface Props {
  documents: Document[]
  projectId: string
}

const docTypeLabels: Record<string, string> = {
  agreement: "Agreement",
  invoice: "Invoice",
  profile: "Profile Handover",
  timeline: "Timeline",
  script: "Script",
  tech_flow: "Tech Flow",
  disclosure: "Disclosure",
  ip_signoff: "IP Sign-off",
  other: "Other",
}

export function DocumentsTab({ documents, projectId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleAddDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formFields = new FormData(form)
    const file = formFields.get("file") as File
    
    if (!file || file.size === 0) {
      setError("Please select a file to upload.")
      setLoading(false)
      return
    }

    const docType = formFields.get("doc_type") as string
    const title = formFields.get("title") as string

    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    const result = await uploadProjectDocument(projectId, docType, title, uploadFormData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      form.reset()
      router.refresh()
    }
    setLoading(false)
  }

  const displayDocuments = documents.filter(d => !d.doc_type.startsWith("poc_"))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Document & Upload File</DialogTitle>
            </DialogHeader>
            {error && <div className="p-2 mb-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>}
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc_type">Document Type *</Label>
                <Select name="doc_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" placeholder="e.g. Signed Agreement - ABC Traders" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File Upload *</Label>
                <Input id="file" name="file" type="file" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Uploading..." : "Upload & Add Document"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Badge variant="outline">{docTypeLabels[doc.doc_type] || doc.doc_type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(doc.uploaded_at)}
                </TableCell>
              </TableRow>
            ))}
            {displayDocuments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No documents added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
