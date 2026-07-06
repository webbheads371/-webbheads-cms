"use client"

import { useState, useTransition } from "react"
import { markWelcomeSeen } from "@/lib/supabase/portal-actions"
import { FileSignature, CreditCard, ArrowRight, Folder } from "lucide-react"

interface StepWelcomeProps {
  clientName: string
  projectId: string
}

export function StepWelcome({ clientName, projectId }: StepWelcomeProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    setError(null)
    startTransition(async () => {
      const result = await markWelcomeSeen(projectId)
      if (result && result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="wizard-step-content flex flex-col items-center text-center animate-fade-in duration-500">
      {/* Company Logo */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-xl animate-pulse" />
        <div className="relative p-4 bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20 rounded-3xl border border-amber-500/20 dark:border-amber-500/30 shadow-inner hover:scale-110 transition-transform duration-300 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="WebbHeads Logo"
            className="h-12 w-12 object-contain"
          />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
        Welcome to{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-slate-400">
          WebbHeads!
        </span>
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-lg mt-3 text-base leading-relaxed">
        We&apos;re thrilled to have you! Let&apos;s get your project set up and running in a few quick steps.
      </p>

      {/* Onboarding steps cards */}
      <div className="w-full max-w-lg grid grid-cols-1 gap-4 mt-8 text-left">
        {/* Step 2 */}
        <div className="group flex items-start gap-4 p-4 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <FileSignature className="h-6 w-6" />
          </div>
          <div>
            <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">Step 2 — Project Agreement</strong>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Review and sign your digital project contract</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="group flex items-start gap-4 p-4 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">Step 3 — Advance Payment</strong>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Securely submit the 50% advance payment to activate your timeline</p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="group flex items-start gap-4 p-4 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-400/10 text-slate-600 dark:bg-slate-400/20 dark:text-slate-400 border border-slate-400/20 group-hover:scale-105 transition-transform duration-300">
            <Folder className="h-6 w-6" />
          </div>
          <div>
            <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">Step 4 — Profile Handover</strong>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Provide your assets, credentials, and details to our team</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full max-w-lg mt-8">
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm mb-4 font-semibold bg-red-50 dark:bg-red-950/20 border border-red-200/30 p-3 rounded-xl animate-shake">
            {error}
          </div>
        )}
        <button
          onClick={handleNext}
          disabled={isPending}
          className="w-full h-12 bg-gradient-to-r from-amber-600 via-amber-500 to-slate-500 hover:from-amber-700 hover:via-amber-600 hover:to-slate-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 dark:shadow-amber-950/40 hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          id="welcome-next-btn"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Starting...
            </span>
          ) : (
            <>
              Let&apos;s Get Started
              <ArrowRight className="h-5 w-5 animate-pulse" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
