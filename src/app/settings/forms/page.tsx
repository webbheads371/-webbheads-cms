import { db } from "@/db"
import { form_templates } from "@/db/schema"
import { asc } from "drizzle-orm"
import { FormBuilderClient } from "./form-builder-client"

export default async function FormBuilderPage() {
  const templates = await db
    .select()
    .from(form_templates)
    .orderBy(asc(form_templates.sort_order))

  return (
    <div className="settings-page">
      <div className="page-header-wrapper">
        <h1 className="page-title">Form Builder</h1>
        <p className="page-subtitle">
          Build the Profile Handover form that clients fill in during Step 4. Scope questions to
          client type (Tech / Content / General).
        </p>
      </div>
      <FormBuilderClient initialTemplates={(templates ?? []) as any} />
    </div>
  )
}
