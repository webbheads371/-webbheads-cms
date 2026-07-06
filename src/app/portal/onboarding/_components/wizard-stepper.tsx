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
    <div className="wizard-stepper flex md:flex-col gap-6 md:gap-8 sticky top-24 z-10 glass-frost md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-0 border-white/30 dark:border-white/10 backdrop-blur-xl md:backdrop-blur-none">
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
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm transition-all duration-500 ${
                status === "done"
                  ? "border-emerald-500 bg-emerald-500/90 text-white dark:border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : status === "active"
                  ? "border-[#D6A33C] text-[#D6A33C] dark:border-[#E8C56B] dark:text-[#E8C56B] shadow-[0_0_20px_rgba(214,163,60,0.3)] dark:shadow-[0_0_25px_rgba(232,197,107,0.2)] scale-105"
                  : "border-slate-300/60 text-slate-400 dark:border-slate-700 dark:text-slate-500"
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
                    ? "text-slate-900 dark:text-white font-bold"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </span>
              <span className="hidden md:inline text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {status === "done" ? "Completed" : status === "active" ? "In Progress" : "Pending"}
              </span>
            </div>


          </div>
        )
      })}
    </div>
  )
}
