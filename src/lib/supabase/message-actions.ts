"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createClient, createAdminClient } from "./server"

export interface Message {
  id: string
  project_id: string
  sender_id: string
  sender_role: 'client' | 'admin' | 'tech_lead' | 'content_lead' | 'sales'
  recipient_role: 'client' | 'admin' | 'tech_lead' | 'content_lead' | 'sales'
  recipient_id: string | null
  message: string
  created_at: string
  sender_name?: string
}

// ─── Fetch Messages for a Project ──────────────────────────────────────────
export async function getProjectMessages(projectId: string) {
  noStore()
  const supabase = createClient()
  
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  if (messages.length === 0) return []

  // Extract unique sender IDs from messages to optimize the database query
  const senderIds = Array.from(new Set(messages.map((m: any) => m.sender_id)))

  const adminClient = createAdminClient()
  const { data: staffMembers } = await adminClient
    .from("staff")
    .select("id, full_name, role")
    .in("id", senderIds)

  const { data: clientUsers } = await adminClient
    .from("client_users")
    .select("id, full_name")
    .in("id", senderIds)

  const userMap = new Map<string, { name: string; role: string }>()
  staffMembers?.forEach(s => userMap.set(s.id, { name: s.full_name, role: s.role }))
  clientUsers?.forEach(c => userMap.set(c.id, { name: c.full_name, role: 'client' }))

  const processedMessages = messages.map((msg: any) => {
    const userDetail = userMap.get(msg.sender_id)
    return {
      ...msg,
      sender_name: userDetail ? userDetail.name : msg.sender_role === 'client' ? 'Client' : 'Staff'
    }
  })

  return processedMessages
}

// ─── Send Message ──────────────────────────────────────────────────────────
export async function sendMessage({
  projectId,
  messageText,
  recipientRole,
  recipientId
}: {
  projectId: string
  messageText: string
  recipientRole: 'client' | 'admin' | 'tech_lead' | 'content_lead' | 'sales'
  recipientId: string | null
}) {
  noStore()
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check if sender is client
  const { data: clientUser } = await supabase
    .from("client_users")
    .select("id")
    .eq("id", user.id)
    .single()

  let senderRole: 'client' | 'admin' | 'tech_lead' | 'content_lead' | 'sales'
  
  if (clientUser) {
    senderRole = 'client'
  } else {
    // Fetch staff role
    const { data: staff } = await supabase
      .from("staff")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (!staff) return { error: "User role not found" }
    senderRole = staff.role as any
  }

  const { error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      sender_id: user.id,
      sender_role: senderRole,
      recipient_role: recipientRole,
      recipient_id: recipientId || null,
      message: messageText,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error("Error sending message:", error)
    return { error: error.message }
  }

  return { error: null }
}

// ─── Fetch Active Conversations for Staff ────────────────────────────────────
export async function getStaffConversations() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!staff) return []

  // Fetch projects that staff has access to
  // Admins & Sales can see all projects, Tech Lead & Content Lead can only see assigned ones
  let query = supabase
    .from("projects")
    .select(`
      id,
      name,
      client:client_id (
        id,
        company_name,
        contact_name
      ),
      tech_lead_id,
      content_lead_id,
      sales_lead_id
    `)

  if (staff.role === 'tech_lead') {
    query = query.eq("tech_lead_id", user.id)
  } else if (staff.role === 'content_lead') {
    query = query.eq("content_lead_id", user.id)
  } else if (staff.role === 'sales') {
    // sales can see all
  }

  const { data: projects, error } = await query
  if (error || !projects) {
    console.error("Error fetching staff conversations projects:", error)
    return []
  }

  // 1. Fetch client users for these clients in one query
  const clientIds = Array.from(new Set(projects.map(p => (p.client as any)?.id).filter(Boolean)))
  const adminClient = createAdminClient()
  const { data: allClientUsers } = await adminClient
    .from("client_users")
    .select("id, full_name, email, client_id")
    .in("client_id", clientIds)

  // 2. Fetch last messages in one query (ordered by created_at desc)
  const projectIds = projects.map(p => p.id)
  const { data: allMessages } = await supabase
    .from("messages")
    .select("project_id, message, created_at, sender_role")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })

  // Group client users and messages by ID
  const clientUsersByClientId = new Map<string, any[]>()
  allClientUsers?.forEach(cu => {
    const list = clientUsersByClientId.get(cu.client_id) || []
    list.push(cu)
    clientUsersByClientId.set(cu.client_id, list)
  })

  const lastMessageByProjectId = new Map<string, any>()
  allMessages?.forEach(m => {
    if (!lastMessageByProjectId.has(m.project_id)) {
      lastMessageByProjectId.set(m.project_id, m)
    }
  })

  const conversations = projects.map(project => {
    const clientId = (project.client as any)?.id
    const clientUsers = clientUsersByClientId.get(clientId) || []
    const lastMsg = lastMessageByProjectId.get(project.id)

    return {
      projectId: project.id,
      projectName: project.name,
      clientName: (project.client as any)?.company_name || (project.client as any)?.contact_name || "Unknown Client",
      clientUsers,
      lastMessage: lastMsg ? lastMsg.message : "No messages yet",
      lastMessageAt: lastMsg ? lastMsg.created_at : null,
      lastMessageSender: lastMsg ? lastMsg.sender_role : null,
      techLeadId: project.tech_lead_id,
      contentLeadId: project.content_lead_id,
      salesLeadId: project.sales_lead_id,
    }
  })

  // Sort conversations by last message timestamp desc
  conversations.sort((a, b) => {
    if (!a.lastMessageAt) return 1
    if (!b.lastMessageAt) return -1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  })

  return conversations
}
