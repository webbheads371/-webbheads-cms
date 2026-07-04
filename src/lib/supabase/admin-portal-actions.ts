"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "./server"

// ─── Generate client portal login ────────────────────────────────────────────

export async function generateClientPortalLogin(
  clientId: string,
  fullName: string,
  email: string
) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Generate one password upfront and use it everywhere
  const tempPassword = Math.random().toString(36).slice(-10) + "A1!"

  const { data: { user }, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })
  if (authError || !user) return { error: authError?.message ?? "Failed to create auth user", credentials: null }

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { error: insertError } = await adminClient.from("client_users").insert({
    id: user.id,
    client_id: clientId,
    full_name: fullName,
    email,
    created_by: currentUser?.id,
  })
  if (insertError) {
    // Rollback auth user
    await adminClient.auth.admin.deleteUser(user.id)
    return { error: insertError.message, credentials: null }
  }

  revalidatePath("/clients")
  return { error: null, credentials: { email, tempPassword } }
}

// ─── Reset client portal password ──────────────────────────────────────────────

export async function resetClientPortalPassword(userId: string) {
  const adminClient = createAdminClient()
  const tempPassword = Math.random().toString(36).slice(-10) + "A1!"
  
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: tempPassword })
  if (error) return { error: error.message, credentials: null }
  
  // We need to fetch their email to display it alongside the temp password
  const { data: { user } } = await adminClient.auth.admin.getUserById(userId)
  
  return { error: null, credentials: { email: user?.email ?? "Unknown", tempPassword } }
}

// ─── Reset staff member password (admin only) ─────────────────────────────────

export async function resetStaffPassword(staffId: string) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Verify the caller is an admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: "Unauthorized", credentials: null }

  const { data: callerStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("id", currentUser.id)
    .single()

  if (callerStaff?.role !== "admin") return { error: "Only admins can reset staff passwords", credentials: null }

  // Generate a new temporary password
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let tempPassword = ""
  for (let i = 0; i < 12; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // Ensure it has at least one uppercase, one number, one special char
  tempPassword = "Wh" + tempPassword + "1!"

  const { error } = await adminClient.auth.admin.updateUserById(staffId, { password: tempPassword })
  if (error) return { error: error.message, credentials: null }

  // Fetch staff email
  const { data: staffRecord } = await supabase
    .from("staff")
    .select("email, full_name")
    .eq("id", staffId)
    .single()

  return {
    error: null,
    credentials: {
      email: staffRecord?.email ?? "Unknown",
      fullName: staffRecord?.full_name ?? "Staff Member",
      tempPassword,
    },
  }
}

// ─── Upload agreement PDF (admin) ─────────────────────────────────────────────

export async function uploadAgreementPdf(projectId: string, formData: FormData) {
  const file = formData.get("file") as File
  if (!file) return { error: "No file uploaded" }

  const adminClient = createAdminClient()
  const path = `agreements/${projectId}/agreement.pdf`

  const { error: uploadError } = await adminClient.storage
    .from("client-uploads")
    .upload(path, file, { upsert: true, contentType: "application/pdf" })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = adminClient.storage
    .from("client-uploads")
    .getPublicUrl(path)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Upsert agreement row
  const { error } = await adminClient.from("agreements").upsert(
    {
      project_id: projectId,
      pdf_url: publicUrl,
      uploaded_by: user?.id,
      uploaded_at: new Date().toISOString(),
    },
    { onConflict: "project_id" }
  )
  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return { error: null, url: publicUrl }
}

// ─── Approve / Reject payment request ────────────────────────────────────────

export async function approvePaymentRequest(paymentRequestId: string, projectId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the request to compute final invoice if advance
  const { data: req } = await supabase
    .from("payment_requests")
    .select("request_type, amount, project_id")
    .eq("id", paymentRequestId)
    .single()

  const { error } = await supabase
    .from("payment_requests")
    .update({
      status: "approved",
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentRequestId)
  if (error) return { error: error.message }

  // If advance approved, auto-create final payment_request (if not yet existing)
  if (req?.request_type === "advance") {
    const { data: project } = await supabase
      .from("projects")
      .select("project_value")
      .eq("id", req.project_id)
      .single()

    const finalAmount = (project?.project_value ?? 0) - req.amount

    await supabase.from("payment_requests").upsert(
      {
        project_id: req.project_id,
        request_type: "final",
        amount: finalAmount,
        status: "pending_payment",
        released: false,
      },
      { onConflict: "project_id,request_type", ignoreDuplicates: true }
    )
  }

  revalidatePath("/payments/queue")
  revalidatePath(`/projects/${projectId}`)
  return { error: null }
}

export async function rejectPaymentRequest(
  paymentRequestId: string,
  projectId: string,
  rejectionReason: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("payment_requests")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentRequestId)
  if (error) return { error: error.message }

  revalidatePath("/payments/queue")
  revalidatePath(`/projects/${projectId}`)
  return { error: null }
}

// ─── Release final invoice ────────────────────────────────────────────────────

export async function releaseFinalInvoice(projectId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("payment_requests")
    .update({
      released: true,
      released_by: user?.id,
      released_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("request_type", "final")
  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return { error: null }
}

// ─── Mark handles collected ───────────────────────────────────────────────────

export async function markHandlesCollected(projectId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("projects")
    .update({
      handles_collected: true,
      handles_collected_at: new Date().toISOString(),
    })
    .eq("id", projectId)
  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return { error: null }
}

// ─── Post status update ───────────────────────────────────────────────────────

export async function postStatusUpdate(
  projectId: string,
  message: string,
  visibleToClient: boolean
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from("project_status_updates").insert({
    project_id: projectId,
    message,
    posted_by: user?.id,
    visible_to_client: visibleToClient,
    posted_at: new Date().toISOString(),
  })
  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return { error: null }
}

// ─── Bank settings upsert ─────────────────────────────────────────────────────

export async function saveBankSettings(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const data: Record<string, string | null> = {
    upi_id: formData.get("upi_id") as string || null,
    bank_name: formData.get("bank_name") as string || null,
    account_holder: formData.get("account_holder") as string || null,
    account_number: formData.get("account_number") as string || null,
    ifsc: formData.get("ifsc") as string || null,
    updated_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  }

  // Handle QR image upload
  const qrFile = formData.get("qr_image") as File | null
  if (qrFile && qrFile.size > 0) {
    const { error: uploadError } = await supabase.storage
      .from("client-uploads")
      .upload("bank-qr/qr.png", qrFile, { upsert: true })
    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage
      .from("client-uploads")
      .getPublicUrl("bank-qr/qr.png")
    data.qr_image_url = publicUrl
  }

  const { error } = await supabase.from("bank_settings").upsert({ id: 1, ...data })
  if (error) return { error: error.message }

  revalidatePath("/settings/bank")
  return { error: null }
}

// ─── Form templates CRUD ──────────────────────────────────────────────────────

export async function createFormTemplate(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from("form_templates").insert({
    scope: formData.get("scope") as string,
    label: formData.get("label") as string,
    field_type: formData.get("field_type") as string,
    is_required: formData.get("is_required") === "true",
    sort_order: Number(formData.get("sort_order")) || 0,
    created_by: user?.id,
  })
  if (error) return { error: error.message }

  revalidatePath("/settings/forms")
  return { error: null }
}

export async function updateFormTemplate(id: string, formData: FormData) {
  const supabase = createClient()

  const { error } = await supabase
    .from("form_templates")
    .update({
      scope: formData.get("scope") as string,
      label: formData.get("label") as string,
      field_type: formData.get("field_type") as string,
      is_required: formData.get("is_required") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/settings/forms")
  return { error: null }
}

export async function deleteFormTemplate(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("form_templates").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/settings/forms")
  return { error: null }
}

// ─── Update client type ───────────────────────────────────────────────────────

export async function updateClientType(clientId: string, clientType: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("clients")
    .update({ client_type: clientType })
    .eq("id", clientId)
  if (error) return { error: error.message }
  revalidatePath(`/clients/${clientId}`)
  return { error: null }
}

// ─── Upload project document ──────────────────────────────────────────────────

export async function uploadProjectDocument(
  projectId: string,
  docType: string,
  title: string,
  formData: FormData
) {
  const file = formData.get("file") as File
  if (!file) return { error: "No file uploaded" }

  const adminClient = createAdminClient()
  const ext = file.name.split(".").pop()
  const timestamp = Date.now()
  const path = `documents/${projectId}/${timestamp}_${file.name}`

  // Upload file to storage
  const { error: uploadError } = await adminClient.storage
    .from("client-uploads")
    .upload(path, file, { upsert: true })
  if (uploadError) return { error: uploadError.message }

  // Get public URL
  const { data: { publicUrl } } = adminClient.storage
    .from("client-uploads")
    .getPublicUrl(path)

  // Insert document row
  const { error } = await adminClient.from("documents").insert({
    project_id: projectId,
    doc_type: docType,
    title: title,
    url: publicUrl,
    is_client_visible: true,
  })
  if (error) return { error: error.message }

  // Insert activity log
  await adminClient.from("activity_log").insert({
    project_id: projectId,
    action: "document_uploaded",
    detail: { doc_type: docType, title: title },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/portal/dashboard")
  return { error: null }
}

// ─── Save Project POC Settings ──────────────────────────────────────────────────

export async function saveProjectPocSettings(
  projectId: string,
  email: string,
  whatsapp: string,
  phone: string
) {
  const adminClient = createAdminClient()

  // 1. Process Email
  const emailUrl = email ? `mailto:${email}` : ""
  const { data: existingEmail } = await adminClient
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .eq("doc_type", "poc_email")
    .maybeSingle()

  if (existingEmail) {
    if (email) {
      await adminClient
        .from("documents")
        .update({ url: emailUrl, title: email })
        .eq("id", existingEmail.id)
    } else {
      await adminClient
        .from("documents")
        .delete()
        .eq("id", existingEmail.id)
    }
  } else if (email) {
    await adminClient.from("documents").insert({
      project_id: projectId,
      doc_type: "poc_email",
      title: email,
      url: emailUrl,
      is_client_visible: true
    })
  }

  // 2. Process WhatsApp
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : ""
  const { data: existingWhatsapp } = await adminClient
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .eq("doc_type", "poc_whatsapp")
    .maybeSingle()

  if (existingWhatsapp) {
    if (whatsapp) {
      await adminClient
        .from("documents")
        .update({ url: whatsappUrl, title: whatsapp })
        .eq("id", existingWhatsapp.id)
    } else {
      await adminClient
        .from("documents")
        .delete()
        .eq("id", existingWhatsapp.id)
    }
  } else if (whatsapp) {
    await adminClient.from("documents").insert({
      project_id: projectId,
      doc_type: "poc_whatsapp",
      title: whatsapp,
      url: whatsappUrl,
      is_client_visible: true
    })
  }

  // 3. Process Phone
  const phoneUrl = phone ? `tel:${phone.replace(/\D/g, "")}` : ""
  const { data: existingPhone } = await adminClient
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .eq("doc_type", "poc_phone")
    .maybeSingle()

  if (existingPhone) {
    if (phone) {
      await adminClient
        .from("documents")
        .update({ url: phoneUrl, title: phone })
        .eq("id", existingPhone.id)
    } else {
      await adminClient
        .from("documents")
        .delete()
        .eq("id", existingPhone.id)
    }
  } else if (phone) {
    await adminClient.from("documents").insert({
      project_id: projectId,
      doc_type: "poc_phone",
      title: phone,
      url: phoneUrl,
      is_client_visible: true
    })
  }

  // Insert activity log
  await adminClient.from("activity_log").insert({
    project_id: projectId,
    action: "poc_updated",
    detail: { email, whatsapp, phone },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/portal/dashboard")
  return { error: null }
}

