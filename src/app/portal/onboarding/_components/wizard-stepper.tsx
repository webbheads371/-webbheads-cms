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
    <div className="wizard-stepper">
      {STEPS.map((step, index) => {
        const status =
          step.number < currentStep
            ? "done"
            : step.number === currentStep
            ? "active"
            : "upcoming"

        return (
          <div key={step.number} className="wizard-step-item">
            <div className={`wizard-step-circle wizard-step-${status}`}>
              {status === "done" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <span className={`wizard-step-label wizard-step-label-${status}`}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`wizard-step-connector ${step.number < currentStep ? "wizard-connector-done" : ""}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
