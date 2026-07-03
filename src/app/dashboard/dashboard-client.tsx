"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { formatCurrency } from "@/lib/utils"
import type { Project, PipelineStage } from "@/types"

interface DashboardProps {
  projects: Project[]
  stages: PipelineStage[]
  totalPendingPayments: number
}

export function DashboardClient({ projects, stages, totalPendingPayments }: DashboardProps) {
  const { activeProjects, closedWon, closedLost } = useMemo(() => ({
    activeProjects: projects.filter((p) => p.status === "active"),
    closedWon: projects.filter((p) => p.status === "closed_won"),
    closedLost: projects.filter((p) => p.status === "closed_lost"),
  }), [projects])

  const stageCounts = useMemo(() =>
    stages.map((s) => ({
      ...s,
      count: projects.filter((p) => p.status === "active" && p.current_stage === s.key).length,
    })),
    [stages, projects]
  )

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your pipeline and active projects"
      />

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{closedWon.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Closed Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{closedLost.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPendingPayments)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageCounts.map((stage) => {
                const maxCount = Math.max(...stageCounts.map((s) => s.count), 1)
                const width = (stage.count / maxCount) * 100
                return (
                  <div key={stage.key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stage.label}</span>
                      <span className="font-medium">{stage.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.client?.company_name}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {project.current_stage.replace("_", " ")}
                  </Badge>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No active projects yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
