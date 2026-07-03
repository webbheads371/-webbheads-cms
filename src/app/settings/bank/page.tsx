import { createClient } from "@/lib/supabase/server"
import { BankSettingsClient } from "./bank-settings-client"
import type { BankSettings } from "@/types"

export default async function BankSettingsPage() {
  const supabase = createClient()
  const { data: bankSettings } = await supabase
    .from("bank_settings")
    .select("*")
    .eq("id", 1)
    .single()

  return (
    <div className="settings-page">
      <div className="page-header-wrapper">
        <h1 className="page-title">Bank & UPI Settings</h1>
        <p className="page-subtitle">
          These details are shown to clients on the payment steps. Keep them up to date.
        </p>
      </div>
      <BankSettingsClient initialSettings={bankSettings as BankSettings | null} />
    </div>
  )
}
