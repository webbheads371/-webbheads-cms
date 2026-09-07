"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { messages, staff, client_users, projects, clients } from "@/db/schema"
import { eq, inArray, and, desc, asc } from "drizzle-orm"

export interface Message {
  id: string
  project_id: string
  sender_id: string
  sender_role: "client" | "admin" | "tech_lead" | "content_lead" | "sales"
  recipient_role: "client" | "admin" | "tech_lead" | "content_lead" | "sales"
  recipient_id: string | null
  message: string
  created_at: string
  sender_name?: string
}

// ─── Fetch Messages for a Project ──────────────────────────────────────────
export async function getProjectMessages(projectId: string) {
  noStore()

  try {
    const rawMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.project_id, projectId))
      .orderBy(asc(messages.created_at))

    if (rawMessages.length === 0) return []

    const senderIds = Array.from(new Set(rawMessages.map((m) => m.sender_id)))

    const staffMembers =
      senderIds.length > 0
        ? await db
            .select({ id: staff.id, full_name: staff.full_name, role: staff.role })
            .from(staff)
            .where(inArray(staff.id, senderIds))
        : []

    const clientUsers =
      senderIds.length > 0
        ? await db
            .select({ id: client_users.id, full_name: client_users.full_name })
            .from(client_users)
            .where(inArray(client_users.id, senderIds))
        : []

    const userMap = new Map<string, { name: string; role: string }>()
    staffMembers.forEach((s) => userMap.set(s.id, { name: s.full_name, role: s.role }))
    clientUsers.forEach((c) => userMap.set(c.id, { name: c.full_name, role: "client" }))

    return rawMessages.map((msg) => {
      const userDetail = userMap.get(msg.sender_id)
      return {
        ...msg,
        created_at: msg.created_at ? msg.created_at.toISOString() : new Date().toISOString(),
        sender_name: userDetail
          ? userDetail.name
          : msg.sender_role === "client"
          ? "Client"
          : "Staff",
      }
    })
  } catch (err) {
    console.error("Error fetching messages:", err)
    return []
  }
}

// ─── Send Message ──────────────────────────────────────────────────────────
export async function sendMessage({
  projectId,
  messageText,
  recipientRole,
  recipientId,
}: {
  projectId: string
  messageText: string
  recipientRole: "client" | "admin" | "tech_lead" | "content_lead" | "sales"
  recipientId: string | null
}) {
  noStore()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Not authenticated" }

  const userId = session.user.id
  let senderRole: "client" | "admin" | "tech_lead" | "content_lead" | "sales"

  if (session.user.userType === "client") {
    senderRole = "client"
  } else {
    const [staffMember] = await db
      .select({ role: staff.role })
      .from(staff)
      .where(eq(staff.id, userId))

    if (!staffMember) return { error: "User role not found" }
    senderRole = staffMember.role as any
  }

  try {
    const [inserted] = await db
      .insert(messages)
      .values({
        project_id: projectId,
        sender_id: userId,
        sender_role: senderRole,
        recipient_role: recipientRole,
        recipient_id: recipientId || null,
        message: messageText,
        created_at: new Date(),
      })
      .returning()

    return {
      error: null,
      data: {
        ...inserted,
        created_at: inserted.created_at.toISOString(),
      },
    }
  } catch (err: any) {
    console.error("Error sending message:", err)
    return { error: err.message || "Failed to send message" }
  }
}

// ─── Fetch Active Conversations for Staff ────────────────────────────────────
export async function getStaffConversations() {
  noStore()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  try {
    const [staffMember] = await db
      .select({ role: staff.role })
      .from(staff)
      .where(eq(staff.id, session.user.id))

    if (!staffMember) return []

    let allProjects = await db.select().from(projects)

    if (staffMember.role === "tech_lead") {
      allProjects = allProjects.filter((p) => p.tech_lead_id === session.user.id)
    } else if (staffMember.role === "content_lead") {
      allProjects = allProjects.filter((p) => p.content_lead_id === session.user.id)
    }

    if (allProjects.length === 0) return []

    const clientIds = Array.from(
      new Set(allProjects.map((p) => p.client_id).filter((id): id is string => Boolean(id)))
    )

    const allClients =
      clientIds.length > 0
        ? await db.select().from(clients).where(inArray(clients.id, clientIds))
        : []

    const allClientUsers =
      clientIds.length > 0
        ? await db.select().from(client_users).where(inArray(client_users.client_id, clientIds))
        : []

    const clientMap = new Map(allClients.map((c) => [c.id, c]))
    const clientUsersByClientId = new Map<string, any[]>()
    allClientUsers.forEach((cu) => {
      const list = clientUsersByClientId.get(cu.client_id) || []
      list.push(cu)
      clientUsersByClientId.set(cu.client_id, list)
    })

    const projectIds = allProjects.map((p) => p.id)
    const allMessages =
      projectIds.length > 0
        ? await db
            .select()
            .from(messages)
            .where(inArray(messages.project_id, projectIds))
            .orderBy(desc(messages.created_at))
        : []

    const lastMessageByProjectId = new Map<string, any>()
    allMessages.forEach((m) => {
      if (!lastMessageByProjectId.has(m.project_id)) {
        lastMessageByProjectId.set(m.project_id, m)
      }
    })

    const conversations = allProjects.map((project) => {
      const clientRecord = project.client_id ? clientMap.get(project.client_id) : null
      const clientUsersList = project.client_id ? clientUsersByClientId.get(project.client_id) || [] : []
      const lastMsg = lastMessageByProjectId.get(project.id)

      return {
        projectId: project.id,
        projectName: project.name,
        clientName:
          clientRecord?.company_name || clientRecord?.contact_name || "Unknown Client",
        clientUsers: clientUsersList,
        lastMessage: lastMsg ? lastMsg.message : "No messages yet",
        lastMessageAt: lastMsg ? lastMsg.created_at.toISOString() : null,
        lastMessageSender: lastMsg ? lastMsg.sender_role : null,
        techLeadId: project.tech_lead_id,
        contentLeadId: project.content_lead_id,
        salesLeadId: project.sales_lead_id,
      }
    })

    conversations.sort((a, b) => {
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })

    return conversations
  } catch (err) {
    console.error("Error fetching staff conversations:", err)
    return []
  }
}

// ─── Unread Messages Logic ───────────────────────────────────────────────────
export async function getUnreadMessagesCount() {
  noStore()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return 0

  try {
    const [staffMember] = await db
      .select({ role: staff.role })
      .from(staff)
      .where(eq(staff.id, session.user.id))

    if (!staffMember) return 0

    let unread = await db
      .select()
      .from(messages)
      .where(and(eq(messages.is_read, false), eq(messages.sender_role, "client")))

    if (staffMember.role === "tech_lead" || staffMember.role === "content_lead") {
      unread = unread.filter((m) => m.recipient_role === staffMember.role)
    }

    return unread.length
  } catch (err) {
    return 0
  }
}

export async function markMessagesAsRead(projectId: string, recipientRole: string) {
  noStore()
  try {
    await db
      .update(messages)
      .set({ is_read: true })
      .where(
        and(
          eq(messages.project_id, projectId),
          eq(messages.recipient_role, recipientRole),
          eq(messages.is_read, false)
        )
      )
  } catch (err) {
    console.error("Error marking messages as read:", err)
  }
}
