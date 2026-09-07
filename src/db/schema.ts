import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  date,
  jsonb,
} from "drizzle-orm/pg-core"

// 1. Staff Table
export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  reset_token: text("reset_token"),
  reset_token_expires: timestamp("reset_token_expires", { withTimezone: true }),
  role: text("role").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// 2. Clients Table
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_name: text("company_name").notNull(),
  contact_name: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  source: text("source"),
  client_type: text("client_type").default("both").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  created_by: uuid("created_by").references(() => staff.id),
})

// 3. Client Users Table
export const client_users = pgTable("client_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  client_id: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  reset_token: text("reset_token"),
  reset_token_expires: timestamp("reset_token_expires", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  created_by: uuid("created_by").references(() => staff.id),
})

// 4. Pipeline Stages Table
export const pipeline_stages = pgTable("pipeline_stages", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  sort_order: integer("sort_order").notNull(),
})

// 5. Projects Table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  client_id: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  current_stage: text("current_stage")
    .references(() => pipeline_stages.key)
    .default("quotation")
    .notNull(),
  status: text("status").default("active").notNull(),
  tech_lead_id: uuid("tech_lead_id").references(() => staff.id),
  content_lead_id: uuid("content_lead_id").references(() => staff.id),
  sales_lead_id: uuid("sales_lead_id").references(() => staff.id, { onDelete: "set null" }),
  project_value: numeric("project_value"),
  advance_percent: numeric("advance_percent").default("50"),
  expected_close_date: date("expected_close_date"),
  expected_start_date: date("expected_start_date"),

  timeline_design_status: text("timeline_design_status"),
  timeline_dev_status: text("timeline_dev_status"),
  timeline_review_status: text("timeline_review_status"),
  timeline_design_name: text("timeline_design_name").default("Design Phase"),
  timeline_dev_name: text("timeline_dev_name").default("Development"),
  timeline_review_name: text("timeline_review_name").default("Review"),

  welcome_seen_at: timestamp("welcome_seen_at", { withTimezone: true }),
  profile_submitted_at: timestamp("profile_submitted_at", { withTimezone: true }),
  handles_collected: boolean("handles_collected").default(false),
  handles_collected_at: timestamp("handles_collected_at", { withTimezone: true }),
  deliverables_content: text("deliverables_content"),
  deliverables_approved: boolean("deliverables_approved").default(false),
  deliverables_approved_at: timestamp("deliverables_approved_at", { withTimezone: true }),
  ai_escalated: boolean("ai_escalated").default(false),

  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// 6. Checklist Templates Table
export const checklist_templates = pgTable("checklist_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  stage_key: text("stage_key")
    .references(() => pipeline_stages.key)
    .notNull(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  is_required: boolean("is_required").default(true),
  sort_order: integer("sort_order").notNull(),
})

// 7. Project Checklist Items Table
export const project_checklist_items = pgTable("project_checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  template_id: uuid("template_id").references(() => checklist_templates.id),
  stage_key: text("stage_key")
    .references(() => pipeline_stages.key)
    .notNull(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  is_required: boolean("is_required").notNull(),
  is_done: boolean("is_done").default(false),
  done_by: uuid("done_by").references(() => staff.id),
  done_at: timestamp("done_at", { withTimezone: true }),
  notes: text("notes"),
})

// 8. Payments Table
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  payment_type: text("payment_type"),
  method: text("method"),
  paid_on: date("paid_on").notNull(),
  note: text("note"),
  recorded_by: uuid("recorded_by").references(() => staff.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// 9. Documents Table
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  doc_type: text("doc_type").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  uploaded_by: uuid("uploaded_by").references(() => staff.id),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  is_client_visible: boolean("is_client_visible").default(false),
})

// 10. Activity Log Table
export const activity_log = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  actor_id: uuid("actor_id").references(() => staff.id),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// 11. Messages Table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  sender_id: uuid("sender_id").notNull(),
  sender_role: text("sender_role").notNull(),
  recipient_role: text("recipient_role").notNull(),
  recipient_id: uuid("recipient_id"),
  message: text("message").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// 12. Content Schedule Table
export const content_schedule = pgTable("content_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  content_name: text("content_name").notNull(),
  caption: text("caption"),
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  is_posted: boolean("is_posted").default(false),
  posted_at: timestamp("posted_at", { withTimezone: true }),
  created_by: uuid("created_by").references(() => staff.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_by: uuid("updated_by").references(() => staff.id),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// 13. Agreements Table
export const agreements = pgTable("agreements", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  agreement_type: text("agreement_type").default("pdf").notNull(),
  content_text: text("content_text"),
  pdf_url: text("pdf_url"),
  uploaded_by: uuid("uploaded_by").references(() => staff.id),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  client_agreed: boolean("client_agreed").default(false),
  agreed_at: timestamp("agreed_at", { withTimezone: true }),
  signature_url: text("signature_url"),
  signature_uploaded_at: timestamp("signature_uploaded_at", { withTimezone: true }),
  confirmation_email_sent: boolean("confirmation_email_sent").default(false),
  confirmation_email_sent_at: timestamp("confirmation_email_sent_at", { withTimezone: true }),
})

// 14. Bank Settings Table
export const bank_settings = pgTable("bank_settings", {
  id: integer("id").default(1).primaryKey(),
  upi_id: text("upi_id"),
  qr_image_url: text("qr_image_url"),
  bank_name: text("bank_name"),
  account_holder: text("account_holder"),
  account_number: text("account_number"),
  ifsc: text("ifsc"),
  updated_by: uuid("updated_by").references(() => staff.id),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// 15. Payment Requests Table
export const payment_requests = pgTable("payment_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  request_type: text("request_type").notNull(),
  amount: numeric("amount").notNull(),
  status: text("status").default("pending_payment").notNull(),
  screenshot_url: text("screenshot_url"),
  submitted_at: timestamp("submitted_at", { withTimezone: true }),
  verified_by: uuid("verified_by").references(() => staff.id),
  verified_at: timestamp("verified_at", { withTimezone: true }),
  rejection_reason: text("rejection_reason"),
  released: boolean("released").default(false),
  released_by: uuid("released_by").references(() => staff.id),
  released_at: timestamp("released_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// 16. Form Templates Table
export const form_templates = pgTable("form_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: text("scope").notNull(),
  label: text("label").notNull(),
  field_type: text("field_type").notNull(),
  is_required: boolean("is_required").default(true),
  sort_order: integer("sort_order").default(0).notNull(),
  created_by: uuid("created_by").references(() => staff.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// 17. Form Responses Table
export const form_responses = pgTable("form_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  template_id: uuid("template_id").references(() => form_templates.id).notNull(),
  value: text("value"),
  submitted_at: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
})

// 18. Project Status Updates Table
export const project_status_updates = pgTable("project_status_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  posted_by: uuid("posted_by").references(() => staff.id),
  posted_at: timestamp("posted_at", { withTimezone: true }).defaultNow(),
  visible_to_client: boolean("visible_to_client").default(true),
})
