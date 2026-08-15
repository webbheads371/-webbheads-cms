"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import {
  client_users,
  staff,
  agreements,
  projects,
  activity_log,
  payment_requests,
  payments,
  project_status_updates,
  bank_settings,
  form_templates,
  clients,
  documents,
  content_schedule,
  checklist_templates,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { uploadToCloudinary } from "@/lib/cloudinary"

function generateSecureTempPassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  const bytes = crypto.randomBytes(length)
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return "Wb!" + password + "9"
}

// ─── Generate client portal login ────────────────────────────────────────────

export async function generateClientPortalLogin(
  clientId: string,
  fullName: string,
  email: string
) {
  const session = await getServerSession(authOptions)
  const normalizedEmail = email.trim().toLowerCase()
  const tempPassword = generateSecureTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  try {
    // Check if email already registered as staff
    const [existingStaff] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(eq(staff.email, normalizedEmail))

    if (existingStaff) {
      return {
        error: "This email is registered as a staff member and cannot be used for a client portal.",
        credentials: null,
      }
    }

    // Check if client user exists
    const [existingClientUser] = await db
      .select()
      .from(client_users)
      .where(eq(client_users.email, normalizedEmail))

    if (existingClientUser) {
      if (existingClientUser.client_id === clientId) {
        await db
          .update(client_users)
          .set({ password_hash: passwordHash })
          .where(eq(client_users.id, existingClientUser.id))

        revalidatePath("/clients")
        return { error: null, credentials: { email: normalizedEmail, tempPassword } }
      } else {
        return {
          error: "This email is already linked to another client portal login.",
          credentials: null,
        }
      }
    }

    await db.insert(client_users).values({
      client_id: clientId,
      full_name: fullName,
      email: normalizedEmail,
      password_hash: passwordHash,
      created_by: session?.user?.id || null,
    })

    revalidatePath("/clients")
    return { error: null, credentials: { email: normalizedEmail, tempPassword } }
  } catch (err: any) {
    return { error: err.message || "Failed to generate client portal login", credentials: null }
  }
}

// ─── Reset client portal password ──────────────────────────────────────────────

export async function resetClientPortalPassword(userId: string) {
  const tempPassword = generateSecureTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  try {
    const [user] = await db
      .select({ email: client_users.email })
      .from(client_users)
      .where(eq(client_users.id, userId))

    if (!user) return { error: "Client user not found", credentials: null }

    await db
      .update(client_users)
      .set({ password_hash: passwordHash })
      .where(eq(client_users.id, userId))

    return { error: null, credentials: { email: user.email, tempPassword } }
  } catch (err: any) {
    return { error: err.message || "Failed to reset client password", credentials: null }
  }
}

// ─── Reset staff member password (admin only) ─────────────────────────────────

export async function resetStaffPassword(staffId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Only admins can reset staff passwords", credentials: null }
  }

  const tempPassword = generateSecureTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  try {
    const [staffRecord] = await db
      .select({ email: staff.email, full_name: staff.full_name })
      .from(staff)
      .where(eq(staff.id, staffId))

    if (!staffRecord) return { error: "Staff member not found", credentials: null }

    await db
      .update(staff)
      .set({ password_hash: passwordHash })
      .where(eq(staff.id, staffId))

    return {
      error: null,
      credentials: {
        email: staffRecord.email,
        fullName: staffRecord.full_name,
        tempPassword,
      },
    }
  } catch (err: any) {
    return { error: err.message || "Failed to reset staff password", credentials: null }
  }
}

// ─── Upload agreement PDF (admin) ─────────────────────────────────────────────

export async function uploadAgreementPdf(projectId: string, formData: FormData) {
  const file = formData.get("file") as File
  if (!file || file.size === 0) return { error: "No file uploaded" }

  const session = await getServerSession(authOptions)

  try {
    const publicUrl = await uploadToCloudinary(file, "webbheads_cms/agreements")

    const [existing] = await db
      .select({ id: agreements.id })
      .from(agreements)
      .where(eq(agreements.project_id, projectId))

    if (existing) {
      await db
        .update(agreements)
        .set({
          pdf_url: publicUrl,
          uploaded_by: session?.user?.id || null,
          uploaded_at: new Date(),
        })
        .where(eq(agreements.project_id, projectId))
    } else {
      await db.insert(agreements).values({
        project_id: projectId,
        pdf_url: publicUrl,
        uploaded_by: session?.user?.id || null,
        uploaded_at: new Date(),
      })
    }

    revalidatePath(`/projects/${projectId}`)
    return { error: null, url: publicUrl }
  } catch (err: any) {
    return { error: err.message || "Failed to save agreement PDF" }
  }
}

// ─── Save text agreement (admin) ──────────────────────────────────────────────

export async function saveAgreementText(projectId: string, contentText: string) {
  const session = await getServerSession(authOptions)

  try {
    const [existing] = await db
      .select({ id: agreements.id })
      .from(agreements)
      .where(eq(agreements.project_id, projectId))

    if (existing) {
      await db
        .update(agreements)
        .set({
          pdf_url: contentText,
          uploaded_by: session?.user?.id || null,
          uploaded_at: new Date(),
        })
        .where(eq(agreements.project_id, projectId))
    } else {
      await db.insert(agreements).values({
        project_id: projectId,
        pdf_url: contentText,
        uploaded_by: session?.user?.id || null,
        uploaded_at: new Date(),
      })
    }

    revalidatePath(`/projects/${projectId}`)
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to save agreement text" }
  }
}

// ─── Save Project Deliverables (admin) ────────────────────────────────────────

export async function saveProjectDeliverables(projectId: string, content: string) {
  const session = await getServerSession(authOptions)

  try {
    await db
      .update(projects)
      .set({ deliverables_content: content })
      .where(eq(projects.id, projectId))

    if (session?.user?.id) {
      await db.insert(activity_log).values({
        project_id: projectId,
        actor_id: session.user.id,
        action: "deliverables_updated",
        detail: { message: "Updated project deliverables" },
      })
    }

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/onboarding")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to save deliverables" }
  }
}

// ─── Approve / Reject payment request ────────────────────────────────────────

export async function approvePaymentRequest(paymentRequestId: string, projectId: string) {
  const session = await getServerSession(authOptions)

  try {
    const [req] = await db
      .select()
      .from(payment_requests)
      .where(eq(payment_requests.id, paymentRequestId))

    await db
      .update(payment_requests)
      .set({
        status: "approved",
        verified_by: session?.user?.id || null,
        verified_at: new Date(),
      })
      .where(eq(payment_requests.id, paymentRequestId))

    if (req) {
      await db.insert(payments).values({
        project_id: req.project_id,
        amount: req.amount,
        payment_type: req.request_type,
        method: "Client Portal",
        paid_on: new Date().toISOString().split("T")[0],
        note: "Approved via Client Portal",
      })
    }

    if (req?.request_type === "advance") {
      const [project] = await db
        .select({ project_value: projects.project_value })
        .from(projects)
        .where(eq(projects.id, req.project_id))

      const totalVal = project?.project_value ? Number(project.project_value) : 0
      const finalAmount = totalVal - Number(req.amount)

      const [existingFinal] = await db
        .select({ id: payment_requests.id })
        .from(payment_requests)
        .where(
          and(
            eq(payment_requests.project_id, req.project_id),
            eq(payment_requests.request_type, "final")
          )
        )

      if (!existingFinal) {
        await db.insert(payment_requests).values({
          project_id: req.project_id,
          request_type: "final",
          amount: String(finalAmount),
          status: "pending_payment",
          released: false,
        })
      }
    }

    revalidatePath("/payments/queue")
    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to approve payment request" }
  }
}

export async function rejectPaymentRequest(
  paymentRequestId: string,
  projectId: string,
  rejectionReason: string
) {
  const session = await getServerSession(authOptions)

  try {
    await db
      .update(payment_requests)
      .set({
        status: "rejected",
        rejection_reason: rejectionReason,
        verified_by: session?.user?.id || null,
        verified_at: new Date(),
      })
      .where(eq(payment_requests.id, paymentRequestId))

    revalidatePath("/payments/queue")
    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to reject payment request" }
  }
}

// ─── Release final invoice ────────────────────────────────────────────────────

export async function releaseFinalInvoice(projectId: string) {
  const session = await getServerSession(authOptions)

  try {
    await db
      .update(payment_requests)
      .set({
        released: true,
        released_by: session?.user?.id || null,
        released_at: new Date(),
      })
      .where(
        and(
          eq(payment_requests.project_id, projectId),
          eq(payment_requests.request_type, "final")
        )
      )

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to release final invoice" }
  }
}

// ─── Mark handles collected ───────────────────────────────────────────────────

export async function markHandlesCollected(projectId: string) {
  try {
    await db
      .update(projects)
      .set({
        handles_collected: true,
        handles_collected_at: new Date(),
      })
      .where(eq(projects.id, projectId))

    revalidatePath(`/projects/${projectId}`)
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to mark handles collected" }
  }
}

// ─── Post status update ───────────────────────────────────────────────────────

export async function postStatusUpdate(
  projectId: string,
  message: string,
  visibleToClient: boolean
) {
  const session = await getServerSession(authOptions)

  try {
    await db.insert(project_status_updates).values({
      project_id: projectId,
      message,
      posted_by: session?.user?.id || null,
      visible_to_client: visibleToClient,
      posted_at: new Date(),
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to post status update" }
  }
}

// ─── Bank settings upsert ─────────────────────────────────────────────────────

export async function saveBankSettings(formData: FormData) {
  const session = await getServerSession(authOptions)

  const upi_id = (formData.get("upi_id") as string) || null
  const bank_name = (formData.get("bank_name") as string) || null
  const account_holder = (formData.get("account_holder") as string) || null
  const account_number = (formData.get("account_number") as string) || null
  const ifsc = (formData.get("ifsc") as string) || null

  const qrFile = (formData.get("qr_image") || formData.get("file")) as File
  let qr_image_url: string | undefined = undefined

  try {
    if (qrFile && qrFile.size > 0) {
      qr_image_url = await uploadToCloudinary(qrFile, "webbheads_cms/bank_qr")
    }

    const [existing] = await db
      .select({ id: bank_settings.id })
      .from(bank_settings)
      .where(eq(bank_settings.id, 1))

    const updateFields: any = {
      upi_id,
      bank_name,
      account_holder,
      account_number,
      ifsc,
      updated_by: session?.user?.id || null,
      updated_at: new Date(),
    }
    if (qr_image_url !== undefined) {
      updateFields.qr_image_url = qr_image_url
    }

    if (existing) {
      await db
        .update(bank_settings)
        .set(updateFields)
        .where(eq(bank_settings.id, 1))
    } else {
      await db.insert(bank_settings).values({
        id: 1,
        ...updateFields,
      })
    }

    revalidatePath("/settings/bank")
    revalidatePath("/portal/onboarding")
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to save bank settings" }
  }
}

// ─── Form templates CRUD ──────────────────────────────────────────────────────

export async function createFormTemplate(formData: FormData) {
  const session = await getServerSession(authOptions)

  try {
    await db.insert(form_templates).values({
      scope: formData.get("scope") as string,
      label: formData.get("label") as string,
      field_type: formData.get("field_type") as string,
      is_required: formData.get("is_required") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
      created_by: session?.user?.id || null,
    })

    revalidatePath("/settings/forms")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to create form template" }
  }
}

export async function updateFormTemplate(id: string, formData: FormData) {
  try {
    await db
      .update(form_templates)
      .set({
        scope: formData.get("scope") as string,
        label: formData.get("label") as string,
        field_type: formData.get("field_type") as string,
        is_required: formData.get("is_required") === "true",
        sort_order: Number(formData.get("sort_order")) || 0,
      })
      .where(eq(form_templates.id, id))

    revalidatePath("/settings/forms")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to update form template" }
  }
}

export async function deleteFormTemplate(id: string) {
  try {
    await db.delete(form_templates).where(eq(form_templates.id, id))
    revalidatePath("/settings/forms")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to delete form template" }
  }
}

// ─── Update client type ───────────────────────────────────────────────────────

export async function updateClientType(clientId: string, clientType: string) {
  try {
    await db
      .update(clients)
      .set({ client_type: clientType })
      .where(eq(clients.id, clientId))

    revalidatePath(`/clients/${clientId}`)
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to update client type" }
  }
}

// ─── Upload project document ──────────────────────────────────────────────────

export async function uploadProjectDocument(
  projectId: string,
  docType: string,
  title: string,
  formData: FormData
) {
  const file = formData.get("file") as File
  if (!file || file.size === 0) return { error: "No file uploaded" }

  const session = await getServerSession(authOptions)

  try {
    const publicUrl = await uploadToCloudinary(file, "webbheads_cms/documents")

    await db.insert(documents).values({
      project_id: projectId,
      doc_type: docType,
      title: title,
      url: publicUrl,
      uploaded_by: session?.user?.id || null,
      is_client_visible: true,
    })

    await db.insert(activity_log).values({
      project_id: projectId,
      actor_id: session?.user?.id || null,
      action: "document_uploaded",
      detail: { doc_type: docType, title: title },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to upload document" }
  }
}

// ─── Save Project POC Settings ──────────────────────────────────────────────────

export async function saveProjectPocSettings(
  projectId: string,
  email: string,
  whatsapp: string,
  phone: string
) {
  const emailUrl = email ? `mailto:${email}` : ""
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : ""
  const phoneUrl = phone ? `tel:${phone.replace(/\D/g, "")}` : ""

  try {
    // 1. Process Email
    const [existingEmail] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.project_id, projectId), eq(documents.doc_type, "poc_email")))

    if (existingEmail) {
      if (email) {
        await db
          .update(documents)
          .set({ url: emailUrl, title: email })
          .where(eq(documents.id, existingEmail.id))
      } else {
        await db.delete(documents).where(eq(documents.id, existingEmail.id))
      }
    } else if (email) {
      await db.insert(documents).values({
        project_id: projectId,
        doc_type: "poc_email",
        title: email,
        url: emailUrl,
        is_client_visible: true,
      })
    }

    // 2. Process WhatsApp
    const [existingWhatsapp] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.project_id, projectId), eq(documents.doc_type, "poc_whatsapp")))

    if (existingWhatsapp) {
      if (whatsapp) {
        await db
          .update(documents)
          .set({ url: whatsappUrl, title: whatsapp })
          .where(eq(documents.id, existingWhatsapp.id))
      } else {
        await db.delete(documents).where(eq(documents.id, existingWhatsapp.id))
      }
    } else if (whatsapp) {
      await db.insert(documents).values({
        project_id: projectId,
        doc_type: "poc_whatsapp",
        title: whatsapp,
        url: whatsappUrl,
        is_client_visible: true,
      })
    }

    // 3. Process Phone
    const [existingPhone] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.project_id, projectId), eq(documents.doc_type, "poc_phone")))

    if (existingPhone) {
      if (phone) {
        await db
          .update(documents)
          .set({ url: phoneUrl, title: phone })
          .where(eq(documents.id, existingPhone.id))
      } else {
        await db.delete(documents).where(eq(documents.id, existingPhone.id))
      }
    } else if (phone) {
      await db.insert(documents).values({
        project_id: projectId,
        doc_type: "poc_phone",
        title: phone,
        url: phoneUrl,
        is_client_visible: true,
      })
    }

    await db.insert(activity_log).values({
      project_id: projectId,
      action: "poc_updated",
      detail: { email, whatsapp, phone },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to save POC settings" }
  }
}

// ─── Save Project Timeline Stages ──────────────────────────────────────────────

export async function saveProjectTimelineStages(
  projectId: string,
  designStatus: string | null,
  devStatus: string | null,
  reviewStatus: string | null,
  designName: string,
  devName: string,
  reviewName: string
) {
  try {
    await db
      .update(projects)
      .set({
        timeline_design_status: designStatus || null,
        timeline_dev_status: devStatus || null,
        timeline_review_status: reviewStatus || null,
        timeline_design_name: designName || "Design Phase",
        timeline_dev_name: devName || "Development",
        timeline_review_name: reviewName || "Review",
      })
      .where(eq(projects.id, projectId))

    await db.insert(activity_log).values({
      project_id: projectId,
      action: "timeline_stages_updated",
      detail: { designStatus, devStatus, reviewStatus, designName, devName, reviewName },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to save timeline stages" }
  }
}

// ─── Content Schedule ─────────────────────────────────────────────────────────

export async function createContentScheduleItem(
  projectId: string,
  contentName: string,
  caption: string,
  scheduledAt: string
) {
  const session = await getServerSession(authOptions)

  try {
    await db.insert(content_schedule).values({
      project_id: projectId,
      content_name: contentName,
      caption: caption || null,
      scheduled_at: new Date(scheduledAt),
      is_posted: false,
      created_by: session?.user?.id || null,
      updated_by: session?.user?.id || null,
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to create content schedule item" }
  }
}

export async function updateContentScheduleItem(
  itemId: string,
  projectId: string,
  contentName: string,
  caption: string,
  scheduledAt: string
) {
  const session = await getServerSession(authOptions)

  try {
    await db
      .update(content_schedule)
      .set({
        content_name: contentName,
        caption: caption || null,
        scheduled_at: new Date(scheduledAt),
        updated_by: session?.user?.id || null,
        updated_at: new Date(),
      })
      .where(eq(content_schedule.id, itemId))

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to update content schedule item" }
  }
}

export async function deleteContentScheduleItem(itemId: string, projectId: string) {
  try {
    await db.delete(content_schedule).where(eq(content_schedule.id, itemId))

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to delete content schedule item" }
  }
}

export async function toggleContentSchedulePosted(
  itemId: string,
  projectId: string,
  isPosted: boolean
) {
  try {
    await db
      .update(content_schedule)
      .set({
        is_posted: isPosted,
        posted_at: isPosted ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(content_schedule.id, itemId))

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to toggle content schedule posted state" }
  }
}

export async function changeStaffSelfPassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, session.user.id))

    if (!staffMember) return { error: "Staff member not found" }

    const isValid = await bcrypt.compare(currentPassword, staffMember.password_hash)
    if (!isValid) return { error: "Current password is incorrect." }

    const newHash = await bcrypt.hash(newPassword, 10)
    await db
      .update(staff)
      .set({ password_hash: newHash })
      .where(eq(staff.id, session.user.id))

    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to change password" }
  }
}

export async function createChecklistTemplate(formData: FormData) {
  try {
    const stageKey = formData.get("stage_key") as string
    const label = formData.get("label") as string
    const category = formData.get("category") as string
    const isRequired = formData.get("is_required") === "on"

    const existing = await db
      .select({ id: checklist_templates.id })
      .from(checklist_templates)
      .where(eq(checklist_templates.stage_key, stageKey))

    await db.insert(checklist_templates).values({
      stage_key: stageKey,
      label,
      category,
      is_required: isRequired,
      sort_order: existing.length,
    })

    revalidatePath("/settings")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to create checklist template" }
  }
}

export async function deleteChecklistTemplate(id: string) {
  try {
    await db.delete(checklist_templates).where(eq(checklist_templates.id, id))
    revalidatePath("/settings")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to delete checklist template" }
  }
}
