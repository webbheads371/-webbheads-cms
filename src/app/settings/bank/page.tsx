import { db } from "@/db"
import { bank_settings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { BankSettingsClient } from "./bank-settings-client"
import type { BankSettings } from "@/types"

export default async function BankSettingsPage() {
  const [bankSettings] = await db
    .select()
    .from(bank_settings)
    .where(eq(bank_settings.id, 1))

  return (
    <div className="settings-page">
      <div className="page-header-wrapper">
        <h1 className="page-title">Bank & UPI Settings</h1>
        <p className="page-subtitle">
          These details are shown to clients on the payment steps. Keep them up to date.
        </p>
      </div>
      <BankSettingsClient initialSettings={(bankSettings as any) || null} />
    </div>
  )
}
