"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "./server"

// ─── Step 1: Mark welcome seen ───────────────────────────────────────────────

export async function markWelcomeSeen(projectId: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from("projects")
    .update({ welcome_seen_at: new Date().toISOString() })
    .eq("id", projectId)
  if (error) return { error: error.message }
  revalidatePath("/portal/onboarding")
  redirect("/portal/onboarding")
}

// ─── Update password (client) ────────────────────────────────────────────────

export async function updateClientPassword(newPassword: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { error: null }
}

// ─── Step 2: Agreement actions ────────────────────────────────────────────────

export async function agreeToAgreement(projectId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("agreements")
    .update({ client_agreed: true, agreed_at: new Date().toISOString() })
    .eq("project_id", projectId)
  if (error) return { error: error.message }
  revalidatePath("/portal/onboarding")
  redirect("/portal/onboarding")
}

export async function uploadSignature(projectId: string, formData: FormData) {
  const file = formData.get("file") as File
  if (!file) return { error: "No signature file uploaded", url: null }

  const supabase = createClient()
  const adminClient = createAdminClient()
  const ext = file.name.split(".").pop()
  const path = `signatures/${projectId}/signature.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from("client-uploads")
    .upload(path, file, { upsert: true })
  if (uploadError) return { error: uploadError.message, url: null }

  const { data: { publicUrl } } = adminClient.storage
    .from("client-uploads")
    .getPublicUrl(path)

  const { error } = await supabase
    .from("agreements")
    .update({
      signature_url: publicUrl,
      signature_uploaded_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
  if (error) return { error: error.message, url: null }

  revalidatePath("/portal/onboarding")
  return { error: null, url: publicUrl }
}

// ─── Step 3: Payment screenshot upload ───────────────────────────────────────

export async function uploadPaymentScreenshot(
  paymentRequestId: string,
  projectId: string,
  requestType: "advance" | "final",
  formData: FormData
) {
  const file = formData.get("file") as File
  if (!file) return { error: "No screenshot file uploaded" }

  const supabase = createClient()
  const adminClient = createAdminClient()
  const ext = file.name.split(".").pop()
  const timestamp = Date.now()
  const path = `payment-screenshots/${projectId}/${requestType}/${timestamp}.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from("client-uploads")
    .upload(path, file, { upsert: false })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = adminClient.storage
    .from("client-uploads")
    .getPublicUrl(path)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data: clientUser } = await adminClient
    .from("client_users")
    .select("client_id")
    .eq("id", user.id)
    .single()
  if (!clientUser) return { error: "Unauthorized" }

  const { data: project } = await adminClient
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .single()
  if (!project || project.client_id !== clientUser.client_id) {
    return { error: "Unauthorized" }
  }

  const { error } = await adminClient
    .from("payment_requests")
    .update({
      screenshot_url: publicUrl,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", paymentRequestId)
  if (error) return { error: error.message }

  revalidatePath("/portal/onboarding")
  revalidatePath("/portal/dashboard")
  return { error: null }
}

// ─── Step 4: Profile handover form submission ─────────────────────────────────

export async function submitProfileForm(
  projectId: string,
  responses: { template_id: string; value: string }[]
) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Authenticate user & check project authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data: clientUser } = await adminClient
    .from("client_users")
    .select("client_id")
    .eq("id", user.id)
    .single()
  if (!clientUser) return { error: "Unauthorized" }

  const { data: project } = await adminClient
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .single()
  if (!project || project.client_id !== clientUser.client_id) {
    return { error: "Unauthorized" }
  }

  // Upsert all form responses using adminClient to bypass RLS write restriction
  const upsertData = responses.map((r) => ({
    project_id: projectId,
    template_id: r.template_id,
    value: r.value,
    submitted_at: new Date().toISOString(),
  }))

  const { error: upsertError } = await adminClient
    .from("form_responses")
    .upsert(upsertData, { onConflict: "project_id,template_id" })
  if (upsertError) return { error: upsertError.message }

  // Mark profile as submitted
  const { error } = await adminClient
    .from("projects")
    .update({ profile_submitted_at: new Date().toISOString() })
    .eq("id", projectId)
  if (error) return { error: error.message }

  // Insert activity log to notify admins
  await adminClient.from("activity_log").insert({
    project_id: projectId,
    action: "profile_updated",
    detail: { message: "Client updated credentials/onboarding details" },
  })

  revalidatePath("/portal")
  revalidatePath("/portal/onboarding")
  revalidatePath("/portal/dashboard")
  return { error: null }
}

// ─── File upload for form responses ──────────────────────────────────────────

export async function uploadFormFile(
  projectId: string,
  templateId: string,
  formData: FormData
) {
  const file = formData.get("file") as File
  if (!file) return { error: "No file uploaded", url: null }

  const adminClient = createAdminClient()
  const path = `form-uploads/${projectId}/${templateId}/${file.name}`

  const { error: uploadError } = await adminClient.storage
    .from("client-uploads")
    .upload(path, file, { upsert: true })
  if (uploadError) return { error: uploadError.message, url: null }

  const { data: { publicUrl } } = adminClient.storage
    .from("client-uploads")
    .getPublicUrl(path)

  return { error: null, url: publicUrl }
}
