"use client"

import { useState } from "react"
import type { ContentSchedule } from "@/types"
import { CalendarDays, CheckCircle2, Clock, ChevronLeft, ChevronRight, Info } from "lucide-react"

interface ScheduleContentTabProps {
  contentItems: ContentSchedule[]
  projectStartDate: string      // created_at or profile_submitted_at
  projectEndDate: string | null // expected_close_date
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function formatDateDisplay(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  })
}

export function ScheduleContentTab({ contentItems, projectStartDate, projectEndDate }: ScheduleContentTabProps) {
  const startDate = new Date(projectStartDate)
  const endDate = projectEndDate ? new Date(projectEndDate) : null

  // Calendar: only months from startDate to endDate
  const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const endMonth = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    : new Date(startDate.getFullYear(), startDate.getMonth() + 2, 1) // default 2 months

  // Build array of all valid months
  const allMonths: Date[] = []
  let cur = new Date(startMonth)
  while (cur <= endMonth) {
    allMonths.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  if (allMonths.length === 0) allMonths.push(new Date(startMonth))

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const viewMonth = allMonths[currentMonthIndex]
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  // Build calendar grid
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Map content by day of month
  const contentByDay = new Map<string, ContentSchedule[]>()
  contentItems.forEach(item => {
    const d = new Date(item.scheduled_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!contentByDay.has(key)) contentByDay.set(key, [])
    contentByDay.get(key)!.push(item)
  })

  const getDayKey = (day: number) => `${year}-${month}-${day}`

  // Selected day items
  const selectedItems = selectedDay
    ? (contentByDay.get(`${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`) ?? [])
    : []

  const monthName = viewMonth.toLocaleString("en-IN", { month: "long", year: "numeric" })

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Content Schedule</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your planned content posts and timeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ── CALENDAR ── */}
        <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 shadow-lg">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => { setCurrentMonthIndex(i => Math.max(0, i - 1)); setSelectedDay(null) }}
              disabled={currentMonthIndex === 0}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-all duration-200 border border-slate-200/60 dark:border-white/5"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="text-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base tracking-tight">{monthName}</h3>
            </div>
            <button
              onClick={() => { setCurrentMonthIndex(i => Math.min(allMonths.length - 1, i + 1)); setSelectedDay(null) }}
              disabled={currentMonthIndex === allMonths.length - 1}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-all duration-200 border border-slate-200/60 dark:border-white/5"
            >
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Calendar note */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
              Calendar view: {startDate.toLocaleString("en-IN", { month: "short", year: "numeric" })}
              {endDate && ` to ${endDate.toLocaleString("en-IN", { month: "short", year: "numeric" })}`} (Based on onboarding)
            </p>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 py-1">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{"SMTWTFS"[i]}</span>
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} className="aspect-square" />

              const thisDate = new Date(year, month, day)
              const isStart = isSameDay(thisDate, startDate)
              const isEnd = endDate ? isSameDay(thisDate, endDate) : false
              const isToday = isSameDay(thisDate, new Date())
              const isSelected = selectedDay ? isSameDay(thisDate, selectedDay) : false
              const dayItems = contentByDay.get(getDayKey(day)) ?? []
              const hasPosted = dayItems.some(i => i.is_posted)
              const hasPending = dayItems.some(i => !i.is_posted)

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : thisDate)}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl text-xs font-bold transition-all duration-200 border-2 ${
                    isSelected
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20 scale-105"
                      : isStart
                      ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                      : isEnd
                      ? "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
                      : isToday
                      ? "border-amber-400/60 text-amber-700 dark:text-amber-400 bg-amber-400/10"
                      : dayItems.length > 0
                      ? "border-slate-200 dark:border-white/10 bg-white/90 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:border-amber-400/40 hover:bg-slate-50 dark:hover:bg-white/20"
                      : "border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100/60 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={isSelected ? "text-white" : ""}>{day}</span>
                  
                  {/* Dot indicators */}
                  {dayItems.length > 0 && !isSelected && (
                    <div className="absolute bottom-1.5 flex gap-1">
                      {hasPosted && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    </div>
                  )}

                  {/* Start/End labels */}
                  {!isSelected && (
                    <>
                      {isStart && <span className="absolute top-1 text-[7px] font-black tracking-tight text-emerald-600 dark:text-emerald-400 uppercase hidden sm:block">Start</span>}
                      {isEnd && <span className="absolute top-1 text-[7px] font-black tracking-tight text-rose-600 dark:text-rose-400 uppercase hidden sm:block">End</span>}
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center flex-wrap gap-4 mt-5 pt-4 border-t border-slate-200/50 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Posted
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Scheduled
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-3.5 h-3.5 rounded-lg bg-emerald-500/10 border-2 border-emerald-500/40 inline-block" /> Start Date
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-3.5 h-3.5 rounded-lg bg-rose-500/10 border-2 border-rose-500/40 inline-block" /> End Date
            </div>
          </div>
        </div>


        {/* ── ALL CONTENT LIST / SELECTED DAY DETAIL ── */}
        <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5 shadow-sm flex flex-col gap-3 max-h-[600px] overflow-y-auto">
          {selectedDay ? (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {selectedDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </h4>
                <button onClick={() => setSelectedDay(null)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                  ← Back
                </button>
              </div>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic py-6 text-center">No content scheduled on this day.</p>
              ) : (
                selectedItems.map(item => (
                  <ContentCard key={item.id} item={item} />
                ))
              )}
            </>
          ) : (
            <>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                All Content
                <span className="text-xs font-normal text-slate-400">({contentItems.length} items)</span>
              </h4>
              {contentItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center">
                    No content scheduled yet.<br />
                    <span className="text-xs">Your team will update this soon.</span>
                  </p>
                </div>
              ) : (
                [...contentItems]
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                  .map(item => <ContentCard key={item.id} item={item} />)
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ContentCard({ item }: { item: ContentSchedule }) {
  const isPast = new Date(item.scheduled_at) < new Date()
  return (
    <div className={`rounded-xl border p-3 transition-all duration-200 ${item.is_posted ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20" : isPast ? "border-orange-200 dark:border-orange-900/40 bg-orange-50/30 dark:bg-orange-950/10" : "border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5"}`}>
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 flex-shrink-0 ${item.is_posted ? "text-emerald-500" : "text-amber-400"}`}>
          {item.is_posted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.content_name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.is_posted ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
              {item.is_posted ? "✓ Posted" : "Scheduled"}
            </span>
          </div>
          {item.caption && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{item.caption}</p>
          )}
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {new Date(item.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            <span className="mx-0.5">·</span>
            {formatTime(item.scheduled_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
