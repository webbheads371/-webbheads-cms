export type StaffRole = "admin" | "tech_lead" | "content_lead" | "sales"
export type ClientType = "tech" | "content" | "both"

export interface Staff {
  id: string
  full_name: string
  email: string
  role: StaffRole
  created_at: string
}

export interface Client {
  id: string
  company_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  source: string | null
  client_type: ClientType
  created_at: string
  created_by: string | null
}

export interface PipelineStage {
  key: string
  label: string
  sort_order: number
}

export type ProjectStatus = "active" | "closed_won" | "closed_lost"

export interface Project {
  id: string
  client_id: string
  name: string
  current_stage: string
  status: ProjectStatus
  tech_lead_id: string | null
  content_lead_id: string | null
  sales_lead_id: string | null
  project_value: number | null
  advance_percent: number | null
  created_at: string
  expected_close_date: string | null
  // Phase 2 fields
  welcome_seen_at: string | null
  profile_submitted_at: string | null
  handles_collected: boolean
  handles_collected_at: string | null
  client?: Client
  tech_lead?: Staff
  content_lead?: Staff
  sales_lead?: Staff
}

export type ChecklistCategory = "tech" | "content" | "sales" | "general"

export interface ChecklistTemplate {
  id: string
  stage_key: string
  label: string
  category: ChecklistCategory
  is_required: boolean
  sort_order: number
}

export interface ProjectChecklistItem {
  id: string
  project_id: string
  template_id: string | null
  stage_key: string
  label: string
  category: ChecklistCategory
  is_required: boolean
  is_done: boolean
  done_by: string | null
  done_at: string | null
  notes: string | null
}

export interface Payment {
  id: string
  project_id: string
  amount: number
  payment_type: "advance" | "partial" | "final"
  method: string | null
  paid_on: string
  note: string | null
  recorded_by: string | null
  created_at: string
}

export interface Document {
  id: string
  project_id: string
  doc_type: string
  title: string
  url: string | null
  uploaded_by: string | null
  uploaded_at: string
  is_client_visible: boolean
}

export interface ActivityLog {
  id: string
  project_id: string
  actor_id: string | null
  action: string
  detail: Record<string, unknown> | null
  created_at: string
  actor?: Staff
}

// ============================================================
// Phase 2 — Client Portal types
// ============================================================

export interface ClientUser {
  id: string
  client_id: string
  full_name: string
  email: string
  created_at: string
  created_by: string | null
}

export interface Agreement {
  id: string
  project_id: string
  pdf_url: string
  uploaded_by: string | null
  uploaded_at: string
  client_agreed: boolean
  agreed_at: string | null
  signature_url: string | null
  signature_uploaded_at: string | null
  confirmation_email_sent: boolean
  confirmation_email_sent_at: string | null
}

export interface BankSettings {
  id: number
  upi_id: string | null
  qr_image_url: string | null
  bank_name: string | null
  account_holder: string | null
  account_number: string | null
  ifsc: string | null
  updated_by: string | null
  updated_at: string
}

export type PaymentRequestStatus = "pending_payment" | "submitted" | "approved" | "rejected"
export type PaymentRequestType = "advance" | "final"

export interface PaymentRequest {
  id: string
  project_id: string
  request_type: PaymentRequestType
  amount: number
  status: PaymentRequestStatus
  screenshot_url: string | null
  submitted_at: string | null
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  released: boolean
  released_by: string | null
  released_at: string | null
  created_at: string
}

export type FormFieldType = "text" | "textarea" | "file" | "url" | "checkbox"
export type FormScope = "tech" | "content" | "general"

export interface FormTemplate {
  id: string
  scope: FormScope
  label: string
  field_type: FormFieldType
  is_required: boolean
  sort_order: number
  created_by: string | null
  created_at: string
}

export interface FormResponse {
  id: string
  project_id: string
  template_id: string
  value: string | null
  submitted_at: string
  template?: FormTemplate
}

export interface ProjectStatusUpdate {
  id: string
  project_id: string
  message: string
  posted_by: string | null
  posted_at: string
  visible_to_client: boolean
  staff?: Staff
}
