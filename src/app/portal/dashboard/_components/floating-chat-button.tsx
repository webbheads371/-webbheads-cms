"use client"

import { MessageCircle, X, ShieldAlert, Laptop, FileSignature } from "lucide-react"

interface FloatingChatButtonProps {
  isOpen: boolean
  onClick: () => void
  techLeadName?: string | null
  contentLeadName?: string | null
  clientType?: string | null
}

export function FloatingChatButton({
  isOpen,
  onClick,
  techLeadName,
  contentLeadName,
  clientType,
}: FloatingChatButtonProps) {
  const getSubLabel = () => {
    if (clientType === "tech" && techLeadName) return `Tech Lead: ${techLeadName}`
    if (clientType === "content" && contentLeadName) return `Content Lead: ${contentLeadName}`
    if (techLeadName && contentLeadName) return `${techLeadName} & ${contentLeadName}`
    if (techLeadName) return `Tech: ${techLeadName}`
    if (contentLeadName) return `Content: ${contentLeadName}`
    return "Support & Admin"
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end gap-2 group print:hidden">
      {/* Tooltip badge visible on hover when closed */}
      {!isOpen && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-100/90 text-slate-100 dark:text-slate-900 text-xs font-semibold shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transform translate-y-1 group-hover:translate-y-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Chat with {getSubLabel()}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label={isOpen ? "Close support chat" : `Chat with assigned team leads (${getSubLabel()})`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative flex items-center justify-center p-3.5 md:p-4 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-500/40 ${
          isOpen
            ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rotate-90"
            : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-1"
        }`}
      >
        {/* Pulsing online status indicator dot */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900" />
          </span>
        )}

        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <MessageCircle className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
        )}
      </button>
    </div>
  )
}
