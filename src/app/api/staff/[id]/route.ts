import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import {
  staff,
  projects,
  clients,
  client_users,
  form_templates,
  project_status_updates,
  activity_log,
  documents,
  payment_requests,
  agreements,
  bank_settings,
  payments,
  project_checklist_items,
} from "@/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can delete staff" }, { status: 403 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
  }

  try {
    await db.update(projects).set({ tech_lead_id: null }).where(eq(projects.tech_lead_id, params.id))
    await db.update(projects).set({ content_lead_id: null }).where(eq(projects.content_lead_id, params.id))
    await db.update(projects).set({ sales_lead_id: null }).where(eq(projects.sales_lead_id, params.id))
    await db.update(clients).set({ created_by: null }).where(eq(clients.created_by, params.id))
    await db.update(client_users).set({ created_by: null }).where(eq(client_users.created_by, params.id))
    await db.update(form_templates).set({ created_by: null }).where(eq(form_templates.created_by, params.id))
    await db.update(project_status_updates).set({ posted_by: null }).where(eq(project_status_updates.posted_by, params.id))
    await db.update(activity_log).set({ actor_id: null }).where(eq(activity_log.actor_id, params.id))
    await db.update(documents).set({ uploaded_by: null }).where(eq(documents.uploaded_by, params.id))
    await db.update(payment_requests).set({ verified_by: null }).where(eq(payment_requests.verified_by, params.id))
    await db.update(payment_requests).set({ released_by: null }).where(eq(payment_requests.released_by, params.id))
    await db.update(agreements).set({ uploaded_by: null }).where(eq(agreements.uploaded_by, params.id))
    await db.update(bank_settings).set({ updated_by: null }).where(eq(bank_settings.updated_by, params.id))
    await db.update(payments).set({ recorded_by: null }).where(eq(payments.recorded_by, params.id))
    await db.update(project_checklist_items).set({ done_by: null }).where(eq(project_checklist_items.done_by, params.id))

    await db.delete(staff).where(eq(staff.id, params.id))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete staff member" }, { status: 500 })
  }
}
