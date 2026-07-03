import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { PipelineStage } from "@/types"

interface Props {
  stages: PipelineStage[]
  currentStage: string
  status: string
}

export function StageStepper({ stages, currentStage, status }: Props) {
  const activeStages = stages.filter(
    (s) => !["closed_won", "closed_lost"].includes(s.key)
  )
  const currentIdx = activeStages.findIndex((s) => s.key === currentStage)

  return (
    <div className="w-full overflow-x-auto py-4 mb-6">
      <div className="flex items-center min-w-max gap-0">
        {activeStages.map((stage, idx) => {
          const isCompleted = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture = idx > currentIdx

          return (
            <div key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary font-bold",
                    isFuture && "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1.5 whitespace-nowrap px-1 max-w-[90px] text-center leading-tight",
                    isCurrent && "font-semibold text-primary",
                    isCompleted && "text-muted-foreground",
                    isFuture && "text-muted-foreground/50"
                  )}
                >
                  {stage.label.length > 20
                    ? stage.label.substring(0, 20) + "..."
                    : stage.label}
                </span>
              </div>
              {idx < activeStages.length - 1 && (
                <div
                  className={cn(
                    "w-8 md:w-12 h-0.5 mx-1 mb-5",
                    idx < currentIdx ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
