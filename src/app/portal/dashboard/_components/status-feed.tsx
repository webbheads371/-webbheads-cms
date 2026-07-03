"use client"

import type { ProjectStatusUpdate } from "@/types"

interface StatusFeedProps {
  updates: ProjectStatusUpdate[]
}

export function StatusFeed({ updates }: StatusFeedProps) {
  if (updates.length === 0) {
    return (
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">🚀 Project Updates</h2>
        <div className="dashboard-empty-state">
          <p>No project updates yet.</p>
          <span className="dashboard-empty-hint">Our team will post updates here as work progresses.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title">🚀 Project Updates</h2>
      <div className="status-feed">
        {updates.map((update, index) => (
          <div key={update.id} className="status-feed-item">
            <div className="status-feed-dot" />
            {index < updates.length - 1 && <div className="status-feed-line" />}
            <div className="status-feed-content">
              <p className="status-feed-message">{update.message}</p>
              <span className="status-feed-date">
                {new Date(update.posted_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
