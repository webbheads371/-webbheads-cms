"use client"

interface HandlesSectionProps {
  handlesCollectedAt: string
}

export function HandlesSection({ handlesCollectedAt }: HandlesSectionProps) {
  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title">🔑 Access Credentials Collected</h2>
      <div className="handles-card">
        <span className="handles-icon">✅</span>
        <div>
          <strong>We&apos;ve received your access details</strong>
          <p>
            Our team has collected your account logins and credentials. We&apos;ve securely stored
            them and will only use them to work on your project.
          </p>
          <span className="handles-date">
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
