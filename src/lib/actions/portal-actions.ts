"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import {
  projects,
  client_users,
  agreements,
  payment_requests,
  form_responses,
  activity_log,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { uploadToCloudinary } from "@/lib/cloudinary"

// ─── Step 1: Mark welcome seen ───────────────────────────────────────────────

export async function markWelcomeSeen(projectId: string) {
  try {
    await db
      .update(projects)
      .set({ welcome_seen_at: new Date() })
      .where(eq(projects.id, projectId))
  } catch (err) {
    console.error("Error marking welcome seen:", err)
  }

  revalidatePath("/portal/onboarding")
  redirect("/portal/onboarding")
}

// ─── Step 1.5: Approve Deliverables ──────────────────────────────────────────

export async function approveDeliverables(projectId: string) {
  try {
    await db
      .update(projects)
      .set({ deliverables_approved: true, deliverables_approved_at: new Date() })
      .where(eq(projects.id, projectId))
  } catch (err) {
    console.error("Error approving deliverables:", err)
  }

  revalidatePath("/portal/onboarding")
  redirect("/portal/onboarding")
}

// ─── Update password (client) ────────────────────────────────────────────────

export async function updateClientPassword(newPassword: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db
      .update(client_users)
      .set({ password_hash: passwordHash })
      .where(eq(client_users.id, session.user.id))

    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to update password" }
  }
}

// ─── Step 2: Agreement actions ────────────────────────────────────────────────

export async function agreeToAgreement(projectId: string) {
  try {
    await db
      .update(agreements)
      .set({ client_agreed: true, agreed_at: new Date() })
      .where(eq(agreements.project_id, projectId))
  } catch (err) {
    console.error("Error agreeing to agreement:", err)
  }

  revalidatePath("/portal/onboarding")
  redirect("/portal/onboarding")
}

export async function uploadSignature(projectId: string, formData: FormData) {
  const file = formData.get("file") as File
  if (!file || file.size === 0) return { error: "No signature file uploaded", url: null }

  try {
    const publicUrl = await uploadToCloudinary(file, "webbheads_cms/signatures")

    await db
      .update(agreements)
      .set({
        signature_url: publicUrl,
        signature_uploaded_at: new Date(),
      })
      .where(eq(agreements.project_id, projectId))

    revalidatePath("/portal/onboarding")
    return { error: null, url: publicUrl }
  } catch (err: any) {
    return { error: err.message || "Failed to upload signature", url: null }
  }
}

// ─── Step 3: Payment screenshot upload ───────────────────────────────────────

export async function uploadPaymentScreenshot(
  paymentRequestId: string,
  projectId: string,
  requestType: "advance" | "final",
  formData: FormData
) {
  const file = formData.get("file") as File
  if (!file || file.size === 0) return { error: "No screenshot file uploaded" }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const publicUrl = await uploadToCloudinary(file, "webbheads_cms/payment_screenshots")

    const [clientUser] = await db
      .select({ client_id: client_users.client_id })
      .from(client_users)
      .where(eq(client_users.id, session.user.id))

    if (!clientUser) return { error: "Unauthorized" }

    const [project] = await db
      .select({ client_id: projects.client_id })
      .from(projects)
      .where(eq(projects.id, projectId))

    if (!project || project.client_id !== clientUser.client_id) {
      return { error: "Unauthorized" }
    }

    await db
      .update(payment_requests)
      .set({
        screenshot_url: publicUrl,
        status: "submitted",
        submitted_at: new Date(),
      })
      .where(eq(payment_requests.id, paymentRequestId))

    revalidatePath("/portal/onboarding")
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to upload payment screenshot" }
  }
}

// ─── Step 4: Profile handover form submission ─────────────────────────────────

export async function submitProfileForm(
  projectId: string,
  responses: { template_id: string; value: string }[]
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const [clientUser] = await db
      .select({ client_id: client_users.client_id })
      .from(client_users)
      .where(eq(client_users.id, session.user.id))

    if (!clientUser) return { error: "Unauthorized" }

    const [project] = await db
      .select({ client_id: projects.client_id })
      .from(projects)
      .where(eq(projects.id, projectId))

    if (!project || project.client_id !== clientUser.client_id) {
      return { error: "Unauthorized" }
    }

    for (const r of responses) {
      const [existing] = await db
        .select({ id: form_responses.id })
        .from(form_responses)
        .where(
          and(
            eq(form_responses.project_id, projectId),
            eq(form_responses.template_id, r.template_id)
          )
        )

      if (existing) {
        await db
          .update(form_responses)
          .set({ value: r.value, submitted_at: new Date() })
          .where(eq(form_responses.id, existing.id))
      } else {
        await db.insert(form_responses).values({
          project_id: projectId,
          template_id: r.template_id,
          value: r.value,
          submitted_at: new Date(),
        })
      }
    }

    await db
      .update(projects)
      .set({ profile_submitted_at: new Date() })
      .where(eq(projects.id, projectId))

    await db.insert(activity_log).values({
      project_id: projectId,
      action: "profile_updated",
      detail: { message: "Client updated credentials/onboarding details" },
    })

    revalidatePath("/portal")
    revalidatePath("/portal/onboarding")
    revalidatePath("/portal/dashboard")
    return { error: null }
  } catch (err: any) {
    return { error: err.message || "Failed to submit profile form" }
  }
}

// ─── File upload for form responses ──────────────────────────────────────────

export async function uploadFormFile(
  projectId: string,
  templateId: string,
  formData: FormData
) {
  const file = formData.get("file") as File
  if (!file || file.size === 0) return { error: "No file uploaded", url: null }

  try {
    const publicUrl = await uploadToCloudinary(file, "webbheads_cms/form_uploads")
    return { error: null, url: publicUrl }
  } catch (err: any) {
    return { error: err.message || "Failed to upload file", url: null }
  }
}
