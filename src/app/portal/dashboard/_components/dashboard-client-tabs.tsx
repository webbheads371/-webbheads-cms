"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { CredentialsForm } from "./credentials-form"
import { FinalInvoiceSection } from "./final-invoice-section"
import { HandlesSection } from "./handles-section"
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
  const searchParams = useSearchParams()
  const activeTopTab = searchParams.get("tab") || "dashboard"

  const [activeSubTab, setActiveSubTab] = useState<"home" | "credentials">("home")

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

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in duration-300">
      {/* Sub-tab selection (only visible if activeTopTab is dashboard) */}
      {activeTopTab === "dashboard" && (
        <div className="flex border border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl gap-2 self-start mb-4 shadow-sm">
          <button
            onClick={() => setActiveSubTab("home")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
              activeSubTab === "home"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/20"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
            id="tab-home"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
          <button
            onClick={() => setActiveSubTab("credentials")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
              activeSubTab === "credentials"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/20"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
            id="tab-credentials"
          >
            <KeyRound className="h-4 w-4" />
            Credentials
          </button>
        </div>
      )}

      {/* Tab Contents */}
      <div className="transition-all duration-300">
        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTopTab === "dashboard" && (
          <div>
            {/* HOME Sub-tab */}
            {activeSubTab === "home" && (
              <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
                {/* Left column: Updates & Banners */}
                <div className="flex flex-col gap-8">
                  {/* Project Status Updates */}
                  <div className="dashboard-section p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
                    <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                      <Rocket className="h-5 w-5 text-indigo-500 animate-pulse" />
                      Project Status Updates
                    </h2>

                    {statusUpdates.length > 0 ? (
                      <div className="space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-800">
                        {statusUpdates.map((update) => (
                          <div key={update.id} className="relative group">
                            <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-955 shadow-sm" />
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{update.message}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(update.posted_at).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400 text-sm py-4">
                        No status updates posted yet. We will update you as development progresses!
                      </div>
                    )}
                  </div>

                  {/* Handles collected banner */}
                  {project.handles_collected && project.handles_collected_at && (
                    <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
                      <HandlesSection handlesCollectedAt={project.handles_collected_at} />
                    </div>
                  )}
                </div>

                {/* Right column: Project Team Overview */}
                <div className="flex flex-col gap-6">
                  <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm flex flex-col gap-4">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                      <UserCheck className="h-5 w-5 text-indigo-500" />
                      Project Team
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Your direct technical and creative contact points at WebbHeads.
                    </p>

                    <div className="flex flex-col gap-3 mt-1">
                      {/* Tech Lead */}
                      <div className="p-3 border border-slate-200/50 dark:border-slate-800/50 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-xs">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider mb-1">Tech Lead</span>
                        {project.tech_lead ? (
                          <>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{project.tech_lead.full_name}</div>
                            <div className="text-slate-400 dark:text-slate-500 mt-0.5 truncate">{project.tech_lead.email}</div>
                          </>
                        ) : (
                          <span className="italic text-slate-400">To be assigned</span>
                        )}
                      </div>

                      {/* Content Lead */}
                      <div className="p-3 border border-slate-200/50 dark:border-slate-800/50 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-xs">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider mb-1">Content Lead</span>
                        {project.content_lead ? (
                          <>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{project.content_lead.full_name}</div>
                            <div className="text-slate-400 dark:text-slate-500 mt-0.5 truncate">{project.content_lead.email}</div>
                          </>
                        ) : (
                          <span className="italic text-slate-400">To be assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CREDENTIALS Sub-tab */}
            {activeSubTab === "credentials" && (
              <div className="max-w-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
                <CredentialsForm
                  projectId={project.id}
                  templates={formTemplates}
                  existingResponses={formResponses}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== DOCUMENTS TAB ==================== */}
        {activeTopTab === "documents" && (
          <div className="dashboard-section p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm animate-fade-in">
            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-indigo-500" />
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
                      className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-slate-800/50 rounded-xl bg-white/50 dark:bg-slate-900/50 hover:border-indigo-500/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
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
                          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5"
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
                <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <Receipt className="h-5 w-5 text-indigo-500" />
                    Advance Payment Details
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Please submit your advance payment to kick off project development. If you already submitted a screenshot, our team is reviewing it.
                  </p>
                  
                  {bankSettings && (
                    <div className="flex flex-col sm:flex-row gap-6 p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-sm">
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
                <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
                  <FinalInvoiceSection
                    projectId={project.id}
                    paymentRequest={finalPayment}
                    bankSettings={bankSettings}
                  />
                </div>
              ) : (
                <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm text-sm text-slate-500 dark:text-slate-400">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Final Balance Payment</h3>
                  Your final balance payment details will be released once development milestones are completed.
                </div>
              )}
            </div>

            {/* Right Column: Payment Summary status */}
            <div className="flex flex-col gap-6">
              <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm flex flex-col gap-4">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  <CreditCard className="h-5 w-5 text-indigo-500" />
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
            <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                Assigned Project Leads
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your direct technical and creative contact points at WebbHeads.
              </p>

              <div className="flex flex-col gap-4 mt-2">
                {/* Tech Lead */}
                <div className="p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Tech Lead
                  </div>
                  {project.tech_lead ? (
                    <>
                      <div className="font-bold text-base text-slate-800 dark:text-slate-200">{project.tech_lead.full_name}</div>
                      <a
                        href={`mailto:${project.tech_lead.email}`}
                        className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors hover:underline inline-flex items-center gap-2"
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
                <div className="p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Content Lead
                  </div>
                  {project.content_lead ? (
                    <>
                      <div className="font-bold text-base text-slate-800 dark:text-slate-200">{project.content_lead.full_name}</div>
                      <a
                        href={`mailto:${project.content_lead.email}`}
                        className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors hover:underline inline-flex items-center gap-2"
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
            <div className="p-6 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                <Phone className="h-5 w-5 text-indigo-500" />
                Contact WebbHeads Support
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Need help or have general queries? Use the channels below to connect with us.
              </p>

              <div className="flex flex-col gap-3 mt-4">
                {/* Email Support */}
                <a
                  href={`mailto:${generalEmail}`}
                  className="flex items-center justify-between p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 font-semibold hover:border-indigo-500/50"
                  id="poc-email-link"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Mail className="h-4 w-4 text-indigo-500" />
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
                  className="flex items-center justify-between p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 font-semibold hover:border-indigo-500/50"
                  id="poc-whatsapp-link"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <MessageCircle className="h-4 w-4 text-indigo-500" />
                    WhatsApp Us
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    Chat live <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

                {/* Call Support */}
                <a
                  href={`tel:${generalPhone.replace(/\D/g, "")}`}
                  className="flex items-center justify-between p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 font-semibold hover:border-indigo-500/50"
                  id="poc-phone-link"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Phone className="h-4 w-4 text-indigo-500" />
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
