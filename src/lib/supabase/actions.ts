"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "./server"

export async function login(formData: FormData) {
  const supabase = createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { error: null }
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath("/login")
}

export async function createClientAction(formData: FormData) {
  const supabase = createClient()
  const data = {
    company_name: formData.get("company_name") as string,
    contact_name: formData.get("contact_name") as string || null,
    phone: formData.get("phone") as string || null,
    email: formData.get("email") as string || null,
    source: formData.get("source") as string || null,
  }
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from("clients").insert({
    ...data,
    created_by: user?.id,
  })
  if (error) return { error: error.message }
  revalidatePath("/clients")
  return { error: null }
}

export async function createProjectAction(formData: FormData) {
  const supabase = createClient()
  const data = {
    client_id: formData.get("client_id") as string,
    name: formData.get("name") as string,
    tech_lead_id: formData.get("tech_lead_id") as string || null,
    content_lead_id: formData.get("content_lead_id") as string || null,
    project_value: formData.get("project_value") ? Number(formData.get("project_value")) : null,
    expected_close_date: formData.get("expected_close_date") as string || null,
  }
  const { error } = await supabase.from("projects").insert(data)
  if (error) return { error: error.message }
  revalidatePath("/projects")
  return { error: null }
}

export async function moveProjectStage(projectId: string, newStage: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("projects")
    .update({ current_stage: newStage })
    .eq("id", projectId)
  if (error) return { error: error.message }

  await supabase.from("activity_log").insert({
    project_id: projectId,
    action: "stage_changed",
    detail: { new_stage: newStage },
  })

  revalidatePath("/pipeline")
  return { error: null }
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from("project_checklist_items")
    .update({
      is_done: isDone,
      done_by: isDone ? user?.id : null,
      done_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
  if (error) return { error: error.message }

  await supabase.from("activity_log").insert({
    project_id: projectIdFromItem(itemId),
    action: "checklist_ticked",
    detail: { item_id: itemId, is_done: isDone },
  })

  revalidatePath("/projects/[id]")
  return { error: null }
}

async function projectIdFromItem(itemId: string): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from("project_checklist_items")
    .select("project_id")
    .eq("id", itemId)
    .single()
  return data?.project_id ?? null
}

export async function addPaymentAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const data = {
    project_id: formData.get("project_id") as string,
    amount: Number(formData.get("amount")),
    payment_type: formData.get("payment_type") as string,
    method: formData.get("method") as string || null,
    paid_on: formData.get("paid_on") as string,
    note: formData.get("note") as string || null,
    recorded_by: user?.id,
  }
  const { error } = await supabase.from("payments").insert(data)
  if (error) return { error: error.message }

  await supabase.from("activity_log").insert({
    project_id: data.project_id,
    action: "payment_added",
    detail: { amount: data.amount, payment_type: data.payment_type },
  })

  revalidatePath("/projects/[id]")
  return { error: null }
}

export async function addDocumentAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const data = {
    project_id: formData.get("project_id") as string,
    doc_type: formData.get("doc_type") as string,
    title: formData.get("title") as string,
    url: formData.get("url") as string || null,
    uploaded_by: user?.id,
  }
  const { error } = await supabase.from("documents").insert(data)
  if (error) return { error: error.message }

  await supabase.from("activity_log").insert({
    project_id: data.project_id,
    action: "document_uploaded",
    detail: { doc_type: data.doc_type, title: data.title },
  })

  revalidatePath("/projects/[id]")
  return { error: null }
}

export async function inviteStaffAction(formData: FormData) {
  const supabase = createClient()
  const email = formData.get("email") as string
  const fullName = formData.get("full_name") as string
  const role = formData.get("role") as string

  const { data: invite, error } = await supabase.auth.admin.inviteUserByEmail(email)
  if (error) return { error: error.message }

  const { error: staffError } = await supabase.from("staff").insert({
    id: invite?.user?.id,
    full_name: fullName,
    email,
    role,
  })
  if (staffError) return { error: staffError.message }

  revalidatePath("/staff")
  return { error: null }
}

export async function updateStaffRole(staffId: string, role: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("staff")
    .update({ role })
    .eq("id", staffId)
  if (error) return { error: error.message }
  revalidatePath("/staff")
  return { error: null }
}

export async function initializeChecklistItems(projectId: string) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("current_stage")
    .eq("id", projectId)
    .single()

  if (!project) return

  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("stage_key", project.current_stage)

  if (!templates) return

  const items = templates.map((t) => ({
    project_id: projectId,
    template_id: t.id,
    stage_key: t.stage_key,
    label: t.label,
    category: t.category,
    is_required: t.is_required,
    is_done: false,
  }))

  await supabase.from("project_checklist_items").insert(items)
}
