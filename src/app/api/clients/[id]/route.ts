import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import {
  clients,
  client_users,
  projects,
  documents,
  agreements,
  payment_requests,
  payments,
  form_responses,
  activity_log,
  project_status_updates,
  project_checklist_items,
} from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const clientId = params.id
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized – please log in" }, { status: 401 })
  }

  if (session.user.role !== "admin" && session.user.role !== "tech_lead") {
    return NextResponse.json(
      { error: "Only admins and tech leads can delete clients." },
      { status: 403 }
    )
  }

  try {
    const clientProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.client_id, clientId))

    const projectIds = clientProjects.map((p) => p.id)

    if (projectIds.length > 0) {
      await db.delete(documents).where(inArray(documents.project_id, projectIds))
      await db.delete(agreements).where(inArray(agreements.project_id, projectIds))
      await db.delete(payment_requests).where(inArray(payment_requests.project_id, projectIds))
      await db.delete(payments).where(inArray(payments.project_id, projectIds))
      await db.delete(form_responses).where(inArray(form_responses.project_id, projectIds))
      await db.delete(activity_log).where(inArray(activity_log.project_id, projectIds))
      await db.delete(project_status_updates).where(inArray(project_status_updates.project_id, projectIds))
      await db.delete(project_checklist_items).where(inArray(project_checklist_items.project_id, projectIds))
      await db.delete(projects).where(inArray(projects.id, projectIds))
    }

    await db.delete(client_users).where(eq(client_users.client_id, clientId))
    await db.delete(clients).where(eq(clients.id, clientId))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete client" }, { status: 500 })
  }
}
