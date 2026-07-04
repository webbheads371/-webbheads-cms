import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { ActivityLog, Staff } from "@/types"
import { ArrowLeftRight, CheckSquare, Coins, FileText, ClipboardList } from "lucide-react"

interface Props {
  activity: (ActivityLog & { actor: Staff | null })[]
}

const actionLabels: Record<string, string> = {
  stage_changed: "Stage Changed",
  checklist_ticked: "Checklist Updated",
  payment_added: "Payment Added",
  document_uploaded: "Document Uploaded",
}

const actionIcons: Record<string, React.ComponentType<any>> = {
  stage_changed: ArrowLeftRight,
  checklist_ticked: CheckSquare,
  payment_added: Coins,
  document_uploaded: FileText,
}

export function ActivityTimeline({ activity }: Props) {
  if (activity.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activity recorded yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {activity.map((entry, idx) => (
            <div key={entry.id} className="relative pl-8 pb-6 last:pb-0">
              {idx < activity.length - 1 && (
                <div className="absolute left-[11px] top-3 bottom-0 w-0.5 bg-border" />
              )}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                {(() => {
                  const Icon = actionIcons[entry.action] || ClipboardList
                  return <Icon className="h-3.5 w-3.5" />
                })()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {actionLabels[entry.action] || entry.action}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {formatDate(entry.created_at)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  by {entry.actor?.full_name || "System"}
                </p>
                {entry.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Object.entries(entry.detail)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
