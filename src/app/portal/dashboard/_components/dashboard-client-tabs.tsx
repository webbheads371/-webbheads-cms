"use client"

import { useState } from "react"
import { CredentialsForm } from "./credentials-form"
import { FinalInvoiceSection } from "./final-invoice-section"
import { HandlesSection } from "./handles-section"
import type { Project, PaymentRequest, BankSettings, ProjectStatusUpdate, FormTemplate, FormResponse } from "@/types"
import { Home, KeyRound, UserCheck, Rocket, FileText, Calendar, Settings, FileSignature, Receipt, CreditCard, Mail, MessageCircle, Phone, ExternalLink, Folder, ArrowRight } from "lucide-react"

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
  formTemplates,
  formResponses,
}: DashboardClientTabsProps) {
  const [activeTab, setActiveTab] = useState<"home" | "credentials" | "poc">("home")

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
    <div className="w-full flex flex-col gap-6">
      {/* Premium Tab Selection */}
      <div className="flex border border-border/60 bg-muted/30 p-1 rounded-xl gap-2 self-start mb-6 shadow-sm">
        <button
          onClick={() => setActiveTab("home")}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "home"
              ? "bg-background text-foreground shadow-sm border border-border/10"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
          id="tab-home"
        >
          <Home className="h-4 w-4 text-primary" />
          Home
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "credentials"
              ? "bg-background text-foreground shadow-sm border border-border/10"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
          id="tab-credentials"
        >
          <KeyRound className="h-4 w-4 text-primary" />
          Credentials
        </button>
        <button
          onClick={() => setActiveTab("poc")}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "poc"
              ? "bg-background text-foreground shadow-sm border border-border/10"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
          id="tab-poc"
        >
          <UserCheck className="h-4 w-4 text-primary" />
          Point of Contact
        </button>
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-300">
        {activeTab === "home" && (
          <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
            {/* Left Main column: Updates, Documents, Payments & Credentials */}
            <div className="flex flex-col gap-8">
              {/* Project Status Updates */}
              <div className="dashboard-section p-6 border rounded-xl bg-card/60 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 text-foreground">
                  <Rocket className="h-5 w-5 text-primary animate-pulse" />
                  Project Status Updates
                </h2>

                {statusUpdates.length > 0 ? (
                  <div className="space-y-4 relative pl-4 border-l border-muted">
                    {statusUpdates.map((update, idx) => (
                      <div key={update.id} className="relative group">
                        <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <div className="text-sm font-medium">{update.message}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
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
                  <div className="text-muted-foreground text-sm py-4">
                    No status updates posted yet. We will update you as development progresses!
                  </div>
                )}
              </div>

              {/* Important Documents */}
              <div className="dashboard-section p-6 border rounded-xl bg-card/60 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
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
                          className="flex items-center justify-between p-4 border rounded-xl bg-background/50 hover:border-primary/50 transition-all group shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm capitalize">
                                {doc.doc_type.replace("_", " ")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
                              </div>
                            </div>
                          </div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary hover:underline font-semibold flex items-center gap-1.5"
                            >
                              Open <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm py-4">
                    No files shared yet. Your project agreement and technical assets will appear here.
                  </div>
                )}
              </div>

              {/* Render screenshot upload for final payment if released */}
              {finalPayment && (
                <div className="p-6 border rounded-xl bg-card/60 shadow-sm">
                  <FinalInvoiceSection
                    projectId={project.id}
                    paymentRequest={finalPayment}
                    bankSettings={bankSettings}
                  />
                </div>
              )}

              {/* Handles collected banner */}
              {project.handles_collected && project.handles_collected_at && (
                <div className="p-6 border rounded-xl bg-card/60 shadow-sm">
                  <HandlesSection handlesCollectedAt={project.handles_collected_at} />
                </div>
              )}
            </div>

            {/* Right column: Payment status overview */}
            <div className="flex flex-col gap-6">
              {/* Payment Balance */}
              <div className="p-6 border rounded-xl bg-card/60 shadow-sm flex flex-col gap-4">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Status
                </h3>

                {project.project_value ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm border-b pb-2 border-border/40">
                      <span className="text-muted-foreground">Total Project Value:</span>
                      <span className="font-bold">{formatCurrency(project.project_value)}</span>
                    </div>

                    {/* Advance Payment Info */}
                    <div className="flex justify-between items-center text-sm border-b pb-2 border-border/40">
                      <span className="text-muted-foreground">Advance payment:</span>
                      {advancePayment?.status === "approved" ? (
                        <span className="badge-success text-xs font-semibold">Paid</span>
                      ) : advancePayment?.status === "submitted" ? (
                        <span className="badge-pending text-xs font-semibold">Under Review</span>
                      ) : (
                        <span className="badge-gray text-xs font-semibold">Unpaid</span>
                      )}
                    </div>

                    {/* Final Payment Info */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Final balance payment:</span>
                      {finalPayment?.status === "approved" ? (
                        <span className="badge-success text-xs font-semibold">Paid</span>
                      ) : finalPayment?.status === "submitted" ? (
                        <span className="badge-pending text-xs font-semibold">Under Review</span>
                      ) : finalPayment ? (
                        <span className="badge-gray text-xs font-semibold">Pending release</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">TBD</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Project value not configured yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "credentials" && (
          <div className="max-w-2xl p-6 border rounded-xl bg-card/60 shadow-sm">
            <CredentialsForm
              projectId={project.id}
              templates={formTemplates}
              existingResponses={formResponses}
            />
          </div>
        )}

        {activeTab === "poc" && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Assigned Project Leads */}
            <div className="p-6 border rounded-xl bg-card/60 shadow-sm flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                <UserCheck className="h-5 w-5 text-primary" />
                Assigned Project Leads
              </h2>
              <p className="text-sm text-muted-foreground">
                Your direct technical and creative contact points at WebbHeads.
              </p>

              <div className="flex flex-col gap-4 mt-2">
                {/* Tech Lead */}
                <div className="p-4 border rounded-xl bg-background/50 flex flex-col gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    Tech Lead
                  </div>
                  {project.tech_lead ? (
                    <>
                      <div className="font-bold text-base text-foreground">{project.tech_lead.full_name}</div>
                      <a
                        href={`mailto:${project.tech_lead.email}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline inline-flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {project.tech_lead.email}
                      </a>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground italic py-1">
                      To be assigned shortly
                    </div>
                  )}
                </div>

                {/* Content Lead */}
                <div className="p-4 border rounded-xl bg-background/50 flex flex-col gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    Content Lead
                  </div>
                  {project.content_lead ? (
                    <>
                      <div className="font-bold text-base text-foreground">{project.content_lead.full_name}</div>
                      <a
                        href={`mailto:${project.content_lead.email}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline inline-flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {project.content_lead.email}
                      </a>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground italic py-1">
                      To be assigned shortly
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* General Support & Inquiries */}
            <div className="p-6 border rounded-xl bg-card/60 shadow-sm flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                <Phone className="h-5 w-5 text-primary" />
                Contact WebbHeads Support
              </h2>
              <p className="text-sm text-muted-foreground">
                Need help or have general queries? Use the links below to connect with us instantly.
              </p>

              <div className="flex flex-col gap-3 mt-4">
                {/* Email Support */}
                <a
                  href={`mailto:${generalEmail}`}
                  className="flex items-center justify-between p-4 border rounded-xl bg-background/50 hover:bg-muted/30 transition-all font-semibold hover:border-primary/50"
                  id="poc-email-link"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Support
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {generalEmail} <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

                {/* WhatsApp Support */}
                <a
                  href={`https://wa.me/${generalWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 border rounded-xl bg-background/50 hover:bg-muted/30 transition-all font-semibold hover:border-primary/50"
                  id="poc-whatsapp-link"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    WhatsApp Us
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Chat live <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

                {/* Call Support */}
                <a
                  href={`tel:${generalPhone.replace(/\D/g, "")}`}
                  className="flex items-center justify-between p-4 border rounded-xl bg-background/50 hover:bg-muted/30 transition-all font-semibold hover:border-primary/50"
                  id="poc-phone-link"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Call Support
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
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
