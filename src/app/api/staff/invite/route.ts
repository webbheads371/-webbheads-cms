import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { staff, client_users, projects, activity_log } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can invite staff members" }, { status: 403 })
  }

  const { email, fullName, role, password, projectIds, clientIds } = await request.json()

  if (!email || !fullName || !role || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Check if email exists in staff
  const [existingStaff] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(eq(staff.email, normalizedEmail))

  if (existingStaff) {
    return NextResponse.json({ error: "A staff member with this email already exists" }, { status: 400 })
  }

  // Check if email exists in client_users
  const [existingClientUser] = await db
    .select({ id: client_users.id })
    .from(client_users)
    .where(eq(client_users.email, normalizedEmail))

  if (existingClientUser) {
    return NextResponse.json({ error: "This email is registered as a client user" }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  // Insert staff member
  const [newStaff] = await db
    .insert(staff)
    .values({
      full_name: fullName,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: role,
    })
    .returning({ id: staff.id })

  if (!newStaff) {
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 })
  }

  const newStaffId = newStaff.id

  // Process Project Assignments
  const allProjectIdsToAssign = new Set<string>(projectIds || [])

  if (clientIds && clientIds.length > 0) {
    const clientProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(inArray(projects.client_id, clientIds))

    clientProjects.forEach((p) => allProjectIdsToAssign.add(p.id))
  }

  const projectIdsArray = Array.from(allProjectIdsToAssign)
  if (projectIdsArray.length > 0) {
    if (role === "tech_lead") {
      await db
        .update(projects)
        .set({ tech_lead_id: newStaffId })
        .where(inArray(projects.id, projectIdsArray))
    } else if (role === "content_lead") {
      await db
        .update(projects)
        .set({ content_lead_id: newStaffId })
        .where(inArray(projects.id, projectIdsArray))
    } else if (role === "sales") {
      await db
        .update(projects)
        .set({ sales_lead_id: newStaffId })
        .where(inArray(projects.id, projectIdsArray))
    }

    const logs = projectIdsArray.map((projectId) => ({
      project_id: projectId,
      action: "staff_assigned",
      detail: { staff_id: newStaffId, role },
    }))

    await db.insert(activity_log).values(logs)
  }

  return NextResponse.json({ ok: true })
}
