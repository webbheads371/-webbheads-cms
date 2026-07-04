"use client"

import { KeyRound, CheckCircle2 } from "lucide-react"

interface HandlesSectionProps {
  handlesCollectedAt: string
}

export function HandlesSection({ handlesCollectedAt }: HandlesSectionProps) {
  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        Access Credentials Collected
      </h2>
      <div className="handles-card flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <strong>We&apos;ve received your access details</strong>
          <p className="text-muted-foreground mt-1">
            Our team has collected your account logins and credentials. We&apos;ve securely stored
            them and will only use them to work on your project.
          </p>
          <span className="handles-date block text-sm text-muted-foreground mt-2 font-medium">
            Collected on{" "}
            {new Date(handlesCollectedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
