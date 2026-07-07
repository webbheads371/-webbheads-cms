"use client"

import { useState } from "react"
import { usePortalTab } from "../../portal-tab-context"
import { CredentialsForm } from "./credentials-form"
import { FinalInvoiceSection } from "./final-invoice-section"
import { HandlesSection } from "./handles-section"
import { ClientGreeting } from "./client-greeting"
import type { Project, PaymentRequest, BankSettings, ProjectStatusUpdate, FormTemplate, FormResponse } from "@/types"
import { 
  Home, KeyRound, UserCheck, Rocket, FileText, Calendar, Settings, 
  FileSignature, Receipt, CreditCard, Mail, MessageCircle, Phone, 
  ExternalLink, Folder, ArrowRight 
} from "lucide-react"

interface DashboardClientTabsProps {
  project: Project & {
    tech_lead?: { full_name: string; email: string } | null
    content_lead?: { full_name: string; email: string } | null
    sales_lead?: { full_name: string; email: string } | null
    client?: any
  }
  paymentRequests: PaymentRequest[]
  bankSettings: BankSettings | null
  statusUpdates: ProjectStatusUpdate[]
  documents: any[]
  formTemplates: FormTemplate[]
  formResponses: FormResponse[]
}

export function DashboardClientTabs({
  project,
  paymentRequests,
  bankSettings,
  statusUpdates,
  documents,
  formResponses,
  formTemplates,
}: DashboardClientTabsProps) {
  const { activeTab: activeTopTab } = usePortalTab()

  const advancePayment = paymentRequests.find((p) => p.request_type === "advance")
  const finalPayment = paymentRequests.find((p) => p.request_type === "final" && p.released)

  // Filter out POC-related metadata documents from client-visible documents
  const importantDocs = documents.filter(
    (d) => d.is_client_visible && !["poc_email", "poc_whatsapp", "poc_phone"].includes(d.doc_type)
  )

  // Extract general company POC values from documents if configured
  const generalEmail = documents.find((d) => d.doc_type === "poc_email")?.title ?? "support@webbheads.com"
  const generalWhatsapp = documents.find((d) => d.doc_type === "poc_whatsapp")?.title ?? "919999999999"
  const generalPhone = documents.find((d) => d.doc_type === "poc_phone")?.title ?? "+919999999999"

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)

  // Sum payments for dashboard card
  const totalInvoiced = paymentRequests.reduce((sum, req) => sum + req.amount, 0)
  const paidAmount = paymentRequests
    .filter((req) => req.status === "approved")
    .reduce((sum, req) => sum + req.amount, 0)
  const outstandingAmount = totalInvoiced - paidAmount

  const isAdvanceApproved = paymentRequests.some(
    (req) => req.request_type === "advance" && req.status === "approved"
  )
  const isFinalApproved = paymentRequests.some(
    (req) => req.request_type === "final" && req.status === "approved"
  )

  const getStageStatus = (stage: string) => {
    const stageLower = stage.toLowerCase()
    let designStatus: 'completed' | 'in_progress' | 'upcoming' = 'completed'
    let devStatus: 'completed' | 'in_progress' | 'upcoming' = 'upcoming'
    let reviewStatus: 'completed' | 'in_progress' | 'upcoming' = 'upcoming'
    
    if (stageLower === 'lead' || stageLower === 'quotation' || stageLower === 'onboarding') {
      designStatus = 'in_progress'
      devStatus = 'upcoming'
      reviewStatus = 'upcoming'
    } else if (stageLower === 'design') {
      designStatus = 'completed'
      devStatus = 'in_progress'
      reviewStatus = 'upcoming'
    } else if (stageLower === 'development') {
      designStatus = 'completed'
      devStatus = 'completed'
      reviewStatus = 'in_progress'
    } else if (stageLower === 'review' || stageLower === 'close_out' || stageLower === 'closed_won') {
      designStatus = 'completed'
      devStatus = 'completed'
      reviewStatus = 'completed'
    }

    // Apply database overrides if set
    if (project.timeline_design_status) {
      designStatus = project.timeline_design_status as any
    }
    if (project.timeline_dev_status) {
      devStatus = project.timeline_dev_status as any
    }
    if (project.timeline_review_status) {
      reviewStatus = project.timeline_review_status as any
    }

    return { designStatus, devStatus, reviewStatus }
  }

  const { designStatus, devStatus, reviewStatus } = getStageStatus(project.current_stage || "design")

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in duration-300">
      {/* Tab Contents */}
      <div className="transition-all duration-300">
        {/* ==================== HOME TAB ==================== */}
        {activeTopTab === "home" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div>
              <ClientGreeting clientName={project.client?.contact_name || project.client?.company_name || "Client"} />
            </div>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8 items-stretch">
              {/* Column 1: Project Timeline & Updates */}
              <div className="p-6 rounded-2xl glass-card-silver flex flex-col gap-6 h-full">
                <h2 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-white flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-[#D6A33C] animate-pulse" />
                  Project Timeline
                </h2>

                {/* Glowing Vertical Timeline Stepper */}
                <div className="relative flex flex-col gap-6 pl-6 my-2">
                  {/* Glowing Vertical Line */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-b from-[#E8C56B] to-[#D6A33C] rounded-full shadow-[0_0_10px_rgba(214,163,60,0.3)] transition-all duration-500" 
                      style={{
                        height: 
                          reviewStatus === "completed" ? "100%" :
                          reviewStatus === "in_progress" ? "75%" :
                          devStatus === "completed" ? "66%" :
                          devStatus === "in_progress" ? "50%" :
                          designStatus === "completed" ? "33%" : "15%"
                      }}
                    />
                  </div>

                  {/* Step 1: Design Phase */}
                  <div className="relative flex gap-4 items-start">
                    <div className={`absolute -left-[23px] top-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 transition-all duration-300 ${
                      designStatus === "completed" 
                        ? "border-[#D6A33C] text-[#D6A33C] shadow-[0_0_8px_rgba(214,163,60,0.25)]" 
                        : designStatus === "in_progress"
                        ? "border-[#D6A33C] text-[#D6A33C] animate-pulse shadow-[0_0_10px_rgba(214,163,60,0.4)]"
                        : "border-[#6B7280]/30 text-[#6B7280]/40"
                    }`}>
                      {designStatus === "completed" ? (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${designStatus === 'in_progress' ? 'bg-[#D6A33C]' : 'bg-[#6B7280]/30'}`} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#111827] dark:text-slate-200 leading-none">Design Phase</span>
                      <span className="text-[11px] text-[#6B7280] dark:text-slate-500 mt-1">
                        {designStatus === "completed" ? "Completed" : designStatus === "in_progress" ? "In Progress" : "Upcoming"}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Development */}
                  <div className="relative flex gap-4 items-start">
                    <div className={`absolute -left-[23px] top-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 transition-all duration-300 ${
                      devStatus === "completed" 
                        ? "border-[#D6A33C] text-[#D6A33C] shadow-[0_0_8px_rgba(214,163,60,0.25)]" 
                        : devStatus === "in_progress"
                        ? "border-[#D6A33C] text-[#D6A33C] animate-pulse shadow-[0_0_10px_rgba(214,163,60,0.4)]"
                        : "border-[#6B7280]/30 text-[#6B7280]/40"
                    }`}>
                      {devStatus === "completed" ? (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${devStatus === 'in_progress' ? 'bg-[#D6A33C] animate-ping' : 'bg-[#6B7280]/30'}`} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#111827] dark:text-slate-200 leading-none">Development</span>
                      <span className="text-[11px] text-[#6B7280] dark:text-slate-500 mt-1">
                        {devStatus === "completed" ? "Completed" : devStatus === "in_progress" ? "In Progress" : "Upcoming"}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Review */}
                  <div className="relative flex gap-4 items-start">
                    <div className={`absolute -left-[23px] top-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 transition-all duration-300 ${
                      reviewStatus === "completed" 
                        ? "border-[#D6A33C] text-[#D6A33C] shadow-[0_0_8px_rgba(214,163,60,0.25)]" 
                        : reviewStatus === "in_progress"
                        ? "border-[#D6A33C] text-[#D6A33C] animate-pulse shadow-[0_0_10px_rgba(214,163,60,0.4)]"
                        : "border-[#6B7280]/30 text-[#6B7280]/40"
                    }`}>
                      {reviewStatus === "completed" ? (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${reviewStatus === 'in_progress' ? 'bg-[#D6A33C]' : 'bg-[#6B7280]/30'}`} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#111827] dark:text-slate-200 leading-none">Review</span>
                      <span className="text-[11px] text-[#6B7280] dark:text-slate-500 mt-1">
                        {reviewStatus === "completed" ? "Completed" : reviewStatus === "in_progress" ? "In Progress" : "Upcoming"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 dark:border-slate-800/60 my-2" />

                {/* Status updates text details */}
                <span className="text-xs text-[#6B7280] dark:text-slate-400 font-semibold uppercase tracking-wider block mb-2">Recent logs</span>
                {statusUpdates.length > 0 ? (
                  <div className="space-y-3 relative pl-4 border-l border-slate-200 dark:border-slate-800">
                    {statusUpdates.slice(0, 2).map((update) => (
                      <div key={update.id} className="relative group text-xs">
                        <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-[#D6A33C]/20 border border-[#D6A33C]/50 shadow-xs" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{update.message}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(update.posted_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400 text-xs py-1 italic">
                    No status updates logged yet.
                  </div>
                )}

                {/* Status Pill Button at Bottom */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold bg-[#E8EAEE] text-[#6B7280] dark:bg-slate-800 dark:text-slate-300">
                    Active Phase: {devStatus === "completed" ? "Review" : devStatus === "in_progress" ? "Development" : "Design"}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Updated {new Date(project.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

            {/* Column 2: Project Team Overview */}
            <div className="p-6 rounded-2xl glass-card-silver flex flex-col gap-6 text-left h-full">
              <h3 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-white">
                Project Team
              </h3>
              
              <div className="flex flex-col gap-4 mt-2">
                {/* Tech Lead Profile Card */}
                <div className="flex items-center gap-4 p-4 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-xs hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#E8C56B] to-[#D6A33C] text-white font-bold text-sm shadow-xs">
                    {project.tech_lead ? project.tech_lead.full_name.split(' ').map((n) => n[0]).join('') : "TL"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block">Tech Lead</span>
                    <span className="font-semibold text-base text-[#111827] dark:text-white truncate block">
                      {project.tech_lead ? project.tech_lead.full_name : "To be assigned"}
                    </span>
                  </div>
                </div>

                {/* Content Lead Profile Card */}
                <div className="flex items-center gap-4 p-4 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-xs hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#E8EAEE] to-slate-400 text-white font-bold text-sm shadow-xs">
                    {project.content_lead ? project.content_lead.full_name.split(' ').map((n) => n[0]).join('') : "CL"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block">Content Lead</span>
                    <span className="font-semibold text-base text-[#111827] dark:text-white truncate block">
                      {project.content_lead ? project.content_lead.full_name : "To be assigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Payment Status Dashboard Card */}
            <div className="p-6 rounded-2xl glass-card-silver flex flex-col gap-6 h-full">
              <h3 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-white">
                Payment Summary
              </h3>
              
              {/* Large Invoice Amount Text */}
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs text-[#6B7280] font-medium uppercase tracking-wider block">Total Invoiced</span>
                <span className="text-4xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                  {totalInvoiced > 0 ? formatCurrency(totalInvoiced) : project.project_value ? formatCurrency(project.project_value) : "TBD"}
                </span>
              </div>

              {/* Paid / Outstanding side-by-side cards */}
              <div className="grid grid-cols-2 gap-3 my-1">
                <div className="p-3 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm flex flex-col">
                  <span className="text-[10px] text-[#6B7280] font-semibold">Paid</span>
                  <span className="text-base font-extrabold text-[#D6A33C] dark:text-[#E8C56B]">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
                <div className="p-3 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm flex flex-col">
                  <span className="text-[10px] text-[#6B7280] font-semibold">Outstanding</span>
                  <span className="text-base font-extrabold text-[#6B7280] dark:text-slate-300">
                    {formatCurrency(outstandingAmount > 0 ? outstandingAmount : 0)}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-slate-200/60 dark:border-slate-800/60 my-1" />

              {/* Payment Status Badges */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#6B7280] dark:text-slate-400 font-semibold">Status Chips</span>
                <div className="flex flex-wrap gap-2">
                  {/* Advance Payment Badge */}
                  {isAdvanceApproved ? (
                    <span className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Paid (Advance)
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                      Pending (Advance)
                    </span>
                  )}

                  {/* Final Payment Badge */}
                  {isFinalApproved ? (
                    <span className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Paid (Final)
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400">
                      Pending (Final)
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200/60 dark:border-slate-800/60 my-1" />

              {/* Recent Transactions List */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#6B7280] dark:text-slate-400 font-semibold">Recent transactions</span>
                <div className="flex flex-col gap-2">
                  {paymentRequests.length > 0 ? (
                    paymentRequests.slice(0, 3).map((req) => (
                      <div key={req.id} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-[#D6A33C]">
                            <svg className="w-3 h-3 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          </div>
                          <span className="text-[#6B7280] dark:text-slate-300 font-medium capitalize">{req.request_type} Request</span>
                        </div>
                        <span className="font-extrabold text-[#111827] dark:text-slate-200">
                          {formatCurrency(req.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-1 text-[11px] italic">No transaction records found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ==================== CREDENTIALS TAB ==================== */}
        {activeTopTab === "credentials" && (
          <div className="w-full max-w-2xl rounded-2xl glass-card-silver animate-fade-in overflow-visible">
            <CredentialsForm
              projectId={project.id}
              templates={formTemplates}
              existingResponses={formResponses}
            />
          </div>
        )}

        {/* ==================== DOCUMENTS TAB ==================== */}
        {activeTopTab === "documents" && (
          <div className="dashboard-section p-6 rounded-2xl glass-card-silver animate-fade-in">
            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-amber-500" />
              Important Documents
            </h2>

            {importantDocs.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {importantDocs.map((doc) => {
                  let IconComponent = Folder
                  if (doc.doc_type === "timeline") IconComponent = Calendar
                  if (doc.doc_type === "tech_flow") IconComponent = Settings
                  if (doc.doc_type.includes("agreement")) IconComponent = FileSignature
                  if (doc.doc_type.includes("invoice")) IconComponent = Receipt

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:border-amber-500/40 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm capitalize text-slate-800 dark:text-slate-200">
                            {doc.doc_type.replace("_", " ")}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-semibold flex items-center gap-1.5"
                        >
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 text-sm py-4">
                No files shared yet. Your project agreement and technical assets will appear here.
              </div>
            )}
          </div>
        )}

        {/* ==================== PAYMENTS TAB ==================== */}
        {activeTopTab === "payments" && (
          <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start animate-fade-in">
            {/* Left Column: QR / Upload Screen / Details */}
            <div className="flex flex-col gap-8">
              {/* Payment Settings */}
              {advancePayment && advancePayment.status !== "approved" && (
                <div className="p-6 rounded-2xl glass-card-silver">
                  <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <Receipt className="h-5 w-5 text-amber-500" />
                    Advance Payment Details
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Please submit your advance payment to kick off project development. If you already submitted a screenshot, our team is reviewing it.
                  </p>
                  
                  {bankSettings && (
                    <div className="flex flex-col sm:flex-row gap-6 p-4 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm text-sm">
                      {bankSettings.qr_image_url && (
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <img src={bankSettings.qr_image_url} alt="UPI QR" className="w-32 h-32 object-cover border rounded bg-white p-1" />
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Scan QR code</span>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-center gap-2">
                        <div><span className="font-semibold text-slate-600 dark:text-slate-400">Account Holder:</span> <span className="text-slate-800 dark:text-slate-200">{bankSettings.account_holder}</span></div>
                        <div><span className="font-semibold text-slate-600 dark:text-slate-400">Account Number:</span> <span className="text-slate-800 dark:text-slate-200">{bankSettings.account_number}</span></div>
                        <div><span className="font-semibold text-slate-600 dark:text-slate-400">IFSC Code:</span> <span className="text-slate-800 dark:text-slate-200">{bankSettings.ifsc}</span></div>
                        <div><span className="font-semibold text-slate-600 dark:text-slate-400">Bank Name:</span> <span className="text-slate-800 dark:text-slate-200">{bankSettings.bank_name}</span></div>
                        {bankSettings.upi_id && <div><span className="font-semibold text-slate-600 dark:text-slate-400">UPI ID:</span> <span className="text-slate-800 dark:text-slate-200">{bankSettings.upi_id}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Render screenshot upload for final payment if released */}
              {finalPayment ? (
                <div className="p-6 rounded-2xl glass-card-silver">
                  <FinalInvoiceSection
                    projectId={project.id}
                    paymentRequest={finalPayment}
                    bankSettings={bankSettings}
                  />
                </div>
              ) : (
                <div className="p-6 rounded-2xl glass-card-silver text-sm text-slate-500 dark:text-slate-400">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Final Balance Payment</h3>
                  Your final balance payment details will be released once development milestones are completed.
                </div>
              )}
            </div>

            {/* Right Column: Payment Summary status */}
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl glass-card-silver flex flex-col gap-4">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Payment Status
                </h3>

                {project.project_value ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm border-b pb-2 border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-slate-500 dark:text-slate-400">Total Project Value:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(project.project_value)}</span>
                    </div>

                    {/* Advance Payment Status */}
                    <div className="flex justify-between items-center text-sm border-b pb-2 border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-slate-500 dark:text-slate-400">Advance payment:</span>
                      {advancePayment?.status === "approved" ? (
                        <span className="badge-success text-xs font-semibold">Paid</span>
                      ) : advancePayment?.status === "submitted" ? (
                        <span className="badge-pending text-xs font-semibold">Under Review</span>
                      ) : (
                        <span className="badge-gray text-xs font-semibold">Unpaid</span>
                      )}
                    </div>

                    {/* Final Payment Status */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Final balance payment:</span>
                      {finalPayment?.status === "approved" ? (
                        <span className="badge-success text-xs font-semibold">Paid</span>
                      ) : finalPayment?.status === "submitted" ? (
                        <span className="badge-pending text-xs font-semibold">Under Review</span>
                      ) : finalPayment ? (
                        <span className="badge-gray text-xs font-semibold">Unpaid</span>
                      ) : (
                        <span className="text-xs text-slate-400">TBD</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Project value not configured yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUPPORT TAB ==================== */}
        {activeTopTab === "support" && (
          <div className="grid md:grid-cols-2 gap-8 items-start animate-fade-in">
            {/* Assigned Project Leads */}
            <div className="p-6 rounded-2xl glass-card-silver flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                <UserCheck className="h-5 w-5 text-amber-500" />
                Assigned Project Leads
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your direct technical and creative contact points at WebbHeads.
              </p>

              <div className="flex flex-col gap-4 mt-2">
                {/* Tech Lead */}
                <div className="p-4 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm flex flex-col gap-2 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Tech Lead
                  </div>
                  {project.tech_lead ? (
                    <>
                      <div className="font-bold text-base text-slate-800 dark:text-slate-200">{project.tech_lead.full_name}</div>
                      <a
                        href={`mailto:${project.tech_lead.email}`}
                        className="text-sm text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors hover:underline inline-flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {project.tech_lead.email}
                      </a>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 italic py-1">
                      To be assigned shortly
                    </div>
                  )}
                </div>

                {/* Content Lead */}
                <div className="p-4 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm flex flex-col gap-2 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Content Lead
                  </div>
                  {project.content_lead ? (
                    <>
                      <div className="font-bold text-base text-slate-800 dark:text-slate-200">{project.content_lead.full_name}</div>
                      <a
                        href={`mailto:${project.content_lead.email}`}
                        className="text-sm text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors hover:underline inline-flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {project.content_lead.email}
                      </a>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 italic py-1">
                      To be assigned shortly
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* General Support & Inquiries */}
            <div className="p-6 rounded-2xl glass-card-silver flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                <Phone className="h-5 w-5 text-amber-500" />
                Contact WebbHeads Support
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Need help or have general queries? Use the channels below to connect with us.
              </p>

              <div className="flex flex-col gap-3 mt-4">
                {/* Email Support */}
                <a
                  href={`mailto:${generalEmail}`}
                  className="flex items-center justify-between p-4 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 font-semibold hover:border-amber-500/50"
                  id="poc-email-link"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Mail className="h-4 w-4 text-amber-500" />
                    Email Support
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    {generalEmail} <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

                {/* WhatsApp Support */}
                <a
                  href={`https://wa.me/${generalWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 font-semibold hover:border-amber-500/50"
                  id="poc-whatsapp-link"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <MessageCircle className="h-4 w-4 text-amber-500" />
                    WhatsApp Us
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    Chat live <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

                {/* Call Support */}
                <a
                  href={`tel:${generalPhone.replace(/\D/g, "")}`}
                  className="flex items-center justify-between p-4 border border-white/30 dark:border-white/10 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 font-semibold hover:border-amber-500/50"
                  id="poc-phone-link"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Phone className="h-4 w-4 text-amber-500" />
                    Call Support
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    {generalPhone} <ArrowRight className="h-3 w-3" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
