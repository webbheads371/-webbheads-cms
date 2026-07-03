"use client"

import type { Document } from "@/types"

interface TimelineSectionProps {
  documents: Document[]
}

export function TimelineSection({ documents }: TimelineSectionProps) {
  if (documents.length === 0) {
    return (
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">📅 Your Timeline</h2>
        <div className="dashboard-empty-state">
          <p>Your project timeline will appear here once it&apos;s ready.</p>
          <span className="dashboard-empty-hint">We&apos;ll notify you when it&apos;s available.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title">📅 Your Timeline</h2>
      <div className="timeline-docs-list">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={doc.url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="timeline-doc-card group"
          >
            <span className="timeline-doc-icon">📄</span>
            <div>
              <strong>{doc.title}</strong>
              <span className="timeline-doc-date">
                {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <span className="timeline-doc-arrow">→</span>
          </a>
        ))}
      </div>
    </div>
  )
}
