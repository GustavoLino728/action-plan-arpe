'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { usePlan } from '@/components/plan-provider'
import { useAuth } from '@/components/auth-provider'
import { PageTitle } from '@/components/page-title'
import { CalendarFilters } from '@/components/calendar/calendar-filters'
import { CalendarView } from '@/components/calendar/calendar-view'
import { canViewAllInitiatives } from '@/lib/roles'
import {
  applyCalendarFilters,
  buildCalendarEvents,
  type CalendarEvent,
  type CalendarFiltersState,
} from '@/lib/calendar-utils'

const DEFAULT_FILTERS: CalendarFiltersState = {
  layers: new Set(['kr', 'etapa']),
  departmentId: 'todos',
  perspective: 'todas',
  status: 'todos',
  responsible: 'todos',
}

export default function CalendarPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    etapas,
    krs,
    iniciativas,
    departments,
    strategic_perspectives,
    openView,
  } = usePlan()

  const [filters, setFilters] = React.useState<CalendarFiltersState>(DEFAULT_FILTERS)
  const [cursor, setCursor] = React.useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const allEvents = React.useMemo(
    () => buildCalendarEvents(iniciativas, krs, etapas),
    [iniciativas, krs, etapas],
  )

  const filteredEvents = React.useMemo(
    () => applyCalendarFilters(allEvents, filters),
    [allEvents, filters],
  )

  const responsibles = React.useMemo(() => {
    const set = new Set<string>()
    etapas.forEach((e) => e.responsavel && set.add(e.responsavel))
    krs.forEach((k) => k.responsavel && set.add(k.responsavel))
    return Array.from(set).sort()
  }, [etapas, krs])

  function prevMonth() {
    setCursor((c) =>
      c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 },
    )
  }
  function nextMonth() {
    setCursor((c) =>
      c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 },
    )
  }
  function goToday() {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
  }

  function handleEventClick(ev: CalendarEvent) {
    if (ev.layer === 'etapa' && ev.stepId) {
      openView(ev.stepId, 'dados')
    } else {
      router.push(`/planos/${ev.initiativeId}`)
    }
  }

  const showDepartment = canViewAllInitiatives(user)

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageTitle
        title="Calendário"
        description="Visualize os prazos das iniciativas, KRs e etapas em formato de calendário."
      />

      <CalendarFilters
        filters={filters}
        onChange={setFilters}
        departments={departments}
        perspectives={strategic_perspectives}
        responsibles={responsibles}
        showDepartment={showDepartment}
      />

      <CalendarView
        events={filteredEvents}
        year={cursor.year}
        month={cursor.month}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToday}
        onEventClick={handleEventClick}
      />
    </main>
  )
}