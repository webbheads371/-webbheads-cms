"use client"

import type { Document } from "@/types"
import { Calendar, FileText, ArrowRight } from "lucide-react"

interface TimelineSectionProps {
  documents: Document[]
}

export function TimelineSection({ documents }: TimelineSectionProps) {
  if (documents.length === 0) {
    return (
      <div className="dashboard-section">
        <h2 className="dashboard-section-title flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Your Timeline
        </h2>
        <div className="dashboard-empty-state">
          <p>Your project timeline will appear here once it&apos;s ready.</p>
          <span className="dashboard-empty-hint">We&apos;ll notify you when it&apos;s available.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        Your Timeline
      </h2>
      <div className="timeline-docs-list">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={doc.url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="timeline-doc-card group flex items-center justify-between p-4 border rounded-xl bg-card hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <strong>{doc.title}</strong>
                <span className="timeline-doc-date block text-sm text-muted-foreground mt-0.5">
                  {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </a>
        ))}
      </div>
    </div>
  )
}
