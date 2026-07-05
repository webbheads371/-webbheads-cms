"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { markWelcomeSeen } from "@/lib/supabase/portal-actions"
import { Sparkles, FileSignature, CreditCard, ClipboardList, ArrowRight, Folder } from "lucide-react"

interface StepWelcomeProps {
  clientName: string
  projectId: string
}

export function StepWelcome({ clientName, projectId }: StepWelcomeProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleNext = () => {
    setError(null)
    startTransition(async () => {
      const result = await markWelcomeSeen(projectId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="wizard-step-content flex flex-col items-center text-center animate-fade-in duration-500">
      {/* Decorative Sparkles */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-violet-500/20 rounded-3xl blur-xl animate-pulse" />
        <div className="relative p-5 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 rounded-3xl border border-amber-500/20 dark:border-amber-500/30 shadow-inner hover:scale-110 transition-transform duration-300">
          <Sparkles className="h-10 w-10 text-amber-500 dark:text-amber-400 animate-spin-slow" />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
        Welcome to{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600">
          WebbHeads!
        </span>
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-lg mt-3 text-base leading-relaxed">
        We&apos;re thrilled to have you! Let&apos;s get your project set up and running in a few quick steps.
      </p>

      {/* Onboarding steps cards */}
      <div className="w-full max-w-lg grid grid-cols-1 gap-4 mt-8 text-left">
        {/* Step 2 */}
        <div className="group flex items-start gap-4 p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <FileSignature className="h-6 w-6" />
          </div>
          <div>
            <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">Step 2 — Project Agreement</strong>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Review and sign your digital project contract</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="group flex items-start gap-4 p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">Step 3 — Advance Payment</strong>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Securely submit the 50% advance payment to activate your timeline</p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="group flex items-start gap-4 p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-500/20 group-hover:scale-105 transition-transform duration-300">
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
          className="w-full h-12 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 hover:from-cyan-600 hover:via-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 dark:shadow-indigo-950/40 hover:shadow-indigo-500/30 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
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
