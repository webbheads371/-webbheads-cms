"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import {
  clients,
  projects,
  activity_log,
  project_checklist_items,
  checklist_templates,
  payments,
  documents,
  staff,
} from "@/db/schema"
import { eq } from "drizzle-orm"

export async function login(formData: FormData) {
  return { error: "Use NextAuth signIn on the client" }
}

export async function logout() {
  revalidatePath("/login")
}

export async function createClientAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  const data = {
    company_name: formData.get("company_name") as string,
    contact_name: (formData.get("contact_name") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    source: (formData.get("source") as string) || null,
    created_by: session?.user?.id || null,
  }

  try {
    await db.insert(clients).values(data)
    revalidatePath("/clients")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to create client" }
  }
}

const parseLeadId = (val: FormDataEntryValue | null) => {
  const str = (val as string)?.trim()
  return !str || str === "none" || str === "null" || str === "" ? null : str
}

export async function createProjectAction(formData: FormData) {
  const data = {
    client_id: (formData.get("client_id") as string) || null,
    name: formData.get("name") as string,
    tech_lead_id: parseLeadId(formData.get("tech_lead_id")),
    content_lead_id: parseLeadId(formData.get("content_lead_id")),
    sales_lead_id: parseLeadId(formData.get("sales_lead_id")),
    project_value: formData.get("project_value")
      ? String(formData.get("project_value"))
      : null,
    expected_close_date: (formData.get("expected_close_date") as string) || null,
  }

  try {
    await db.insert(projects).values(data)
    revalidatePath("/projects")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to create project" }
  }
}

export async function moveProjectStage(projectId: string, newStage: string) {
  try {
    const status = newStage === "closed_won"
      ? "closed_won" : newStage === "closed_lost"
      ? "closed_lost" : "active"

    await db
      .update(projects)
      .set({ current_stage: newStage, status })
      .where(eq(projects.id, projectId))

    await db.insert(activity_log).values({
      project_id: projectId,
      action: "stage_changed",
      detail: { new_stage: newStage },
    })

    await initializeChecklistItems(projectId)

    revalidatePath("/pipeline")
    revalidatePath(`/projects/${projectId}`)
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to move project stage" }
  }
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
  const session = await getServerSession(authOptions)

  try {
    await db
      .update(project_checklist_items)
      .set({
        is_done: isDone,
        done_by: isDone ? session?.user?.id : null,
        done_at: isDone ? new Date() : null,
      })
      .where(eq(project_checklist_items.id, itemId))

    const projectId = await projectIdFromItem(itemId)

    if (projectId) {
      await db.insert(activity_log).values({
        project_id: projectId,
        action: "checklist_ticked",
        detail: { item_id: itemId, is_done: isDone },
      })
    }

    revalidatePath("/projects/[id]")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to toggle checklist item" }
  }
}

async function projectIdFromItem(itemId: string): Promise<string | null> {
  const [item] = await db
    .select({ project_id: project_checklist_items.project_id })
    .from(project_checklist_items)
    .where(eq(project_checklist_items.id, itemId))

  return item?.project_id ?? null
}

export async function addPaymentAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  const projectId = formData.get("project_id") as string
  const amount = Number(formData.get("amount"))
  const paymentType = formData.get("payment_type") as string

  const data = {
    project_id: projectId,
    amount: String(amount),
    payment_type: paymentType,
    method: (formData.get("method") as string) || null,
    paid_on: formData.get("paid_on") as string,
    note: (formData.get("note") as string) || null,
    recorded_by: session?.user?.id || null,
  }

  try {
    await db.insert(payments).values(data)

    await db.insert(activity_log).values({
      project_id: projectId,
      action: "payment_added",
      detail: { amount, payment_type: paymentType },
    })

    revalidatePath("/projects/[id]")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to add payment" }
  }
}

export async function addDocumentAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  const projectId = formData.get("project_id") as string
  const docType = formData.get("doc_type") as string
  const title = formData.get("title") as string

  const data = {
    project_id: projectId,
    doc_type: docType,
    title: title,
    url: (formData.get("url") as string) || null,
    uploaded_by: session?.user?.id || null,
  }

  try {
    await db.insert(documents).values(data)

    await db.insert(activity_log).values({
      project_id: projectId,
      action: "document_uploaded",
      detail: { doc_type: docType, title: title },
    })

    revalidatePath("/projects/[id]")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to add document" }
  }
}

export async function inviteStaffAction(formData: FormData) {
  const email = formData.get("email") as string
  const fullName = formData.get("full_name") as string
  const role = formData.get("role") as string

  try {
    await db.insert(staff).values({
      full_name: fullName,
      email,
      password_hash: "", // To be hashed in Phase 5
      role,
    })

    revalidatePath("/staff")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to add staff member" }
  }
}

export async function updateStaffRole(staffId: string, role: string) {
  try {
    await db.update(staff).set({ role }).where(eq(staff.id, staffId))
    revalidatePath("/staff")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to update staff role" }
  }
}

export async function initializeChecklistItems(projectId: string) {
  try {
    const [project] = await db
      .select({ current_stage: projects.current_stage })
      .from(projects)
      .where(eq(projects.id, projectId))

    if (!project) return

    const templates = await db
      .select()
      .from(checklist_templates)
      .where(eq(checklist_templates.stage_key, project.current_stage))

    if (!templates || templates.length === 0) return

    const items = templates.map((t) => ({
      project_id: projectId,
      template_id: t.id,
      stage_key: t.stage_key,
      label: t.label,
      category: t.category,
      is_required: t.is_required ?? true,
      is_done: false,
    }))

    await db.insert(project_checklist_items).values(items)
  } catch (err) {
    console.error("Error initializing checklist items:", err)
  }
}

export async function updateProjectDetailsAction(projectId: string, clientId: string | null, formData: FormData) {
  try {
    const projectData = {
      name: formData.get("name") as string,
      project_value: (formData.get("project_value") as string) || null,
      advance_percent: formData.get("advance_percent") ? String(formData.get("advance_percent")) : "50",
      tech_lead_id: parseLeadId(formData.get("tech_lead_id")),
      content_lead_id: parseLeadId(formData.get("content_lead_id")),
      sales_lead_id: parseLeadId(formData.get("sales_lead_id")),
    }

    await db.update(projects).set(projectData).where(eq(projects.id, projectId))

    if (clientId) {
      const clientData = {
        company_name: formData.get("company_name") as string,
        contact_name: (formData.get("contact_name") as string) || null,
        email: (formData.get("email") as string) || null,
        phone: (formData.get("phone") as string) || null,
      }
      await db.update(clients).set(clientData).where(eq(clients.id, clientId))
    }

    revalidatePath(`/projects/${projectId}`)
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to update project details" }
  }
}
