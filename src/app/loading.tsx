import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      <p className="text-sm font-medium animate-pulse">Loading section...</p>
    </div>
  )
}
