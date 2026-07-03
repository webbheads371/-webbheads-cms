import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"

export default function ProjectDetailLoading() {
  return (
    <div>
      <PageHeader title="Loading..." description="Loading project details" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}
