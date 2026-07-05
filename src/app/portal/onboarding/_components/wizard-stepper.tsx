"use client"

const STEPS = [
  { number: 1, label: "Welcome" },
  { number: 2, label: "Agreement" },
  { number: 3, label: "Advance Payment" },
  { number: 4, label: "Profile Handover" },
]

interface WizardStepperProps {
  currentStep: number
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  return (
    <div className="wizard-stepper flex md:flex-col gap-6 md:gap-8 sticky top-24 z-10 bg-slate-50/50 dark:bg-slate-950 md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-0 border-slate-200/50 backdrop-blur-md md:backdrop-blur-none">
      {STEPS.map((step, index) => {
        const status =
          step.number < currentStep
            ? "done"
            : step.number === currentStep
            ? "active"
            : "upcoming"

        return (
          <div key={step.number} className="wizard-step-item flex-1 md:flex-initial relative flex items-center md:items-start gap-3 md:gap-4 group">
            {/* Step circle with animation */}
            <div 
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold bg-white dark:bg-slate-900 transition-all duration-500 ${
                status === "done"
                  ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-500"
                  : status === "active"
                  ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.3)] dark:shadow-[0_0_20px_rgba(167,139,250,0.2)] scale-105"
                  : "border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500"
              }`}
            >
              {status === "done" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-fade-in">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className={status === "active" ? "animate-pulse" : ""}>{step.number}</span>
              )}
            </div>

            {/* Label */}
            <div className="flex flex-col">
              <span 
                className={`text-xs md:text-sm font-semibold transition-colors duration-300 ${
                  status === "done"
                    ? "text-slate-900 dark:text-slate-100"
                    : status === "active"
                    ? "text-violet-600 dark:text-violet-400 font-bold"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </span>
              <span className="hidden md:inline text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {status === "done" ? "Completed" : status === "active" ? "In Progress" : "Pending"}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div 
                className={`hidden md:block absolute left-4.5 top-9 -ml-px h-[calc(100%+1rem)] w-[2px] transition-all duration-700 ${
                  step.number < currentStep 
                    ? "bg-emerald-500" 
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
                style={{ left: "18px" }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
