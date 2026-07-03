import { createClient } from "@/lib/supabase/server"
import { FormBuilderClient } from "./form-builder-client"
import type { FormTemplate } from "@/types"

export default async function FormBuilderPage() {
  const supabase = createClient()
  const { data: templates } = await supabase
    .from("form_templates")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <div className="settings-page">
      <div className="page-header-wrapper">
        <h1 className="page-title">Form Builder</h1>
        <p className="page-subtitle">
          Build the Profile Handover form that clients fill in during Step 4. Scope questions to
          client type (Tech / Content / General).
        </p>
      </div>
      <FormBuilderClient initialTemplates={(templates ?? []) as FormTemplate[]} />
    </div>
  )
}
