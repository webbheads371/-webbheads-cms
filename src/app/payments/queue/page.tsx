import { createClient } from "@/lib/supabase/server"
import { PaymentQueueClient } from "./payment-queue-client"

export default async function PaymentQueuePage() {
  const supabase = createClient()

  const { data: submittedPayments } = await supabase
    .from("payment_requests")
    .select(`
      *,
      project:projects(
        id,
        name,
        project_value,
        client:clients(company_name, contact_name)
      )
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true })

  return (
    <div className="page-container">
      <div className="page-header-wrapper">
        <h1 className="page-title">Payment Verification Queue</h1>
        <p className="page-subtitle">
          Review and approve or reject client payment screenshots.
        </p>
      </div>
      <PaymentQueueClient payments={submittedPayments ?? []} />
    </div>
  )
}
