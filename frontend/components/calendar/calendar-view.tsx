'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/button'
import { TONE_CLASSES, STATUS_META } from '@/lib/plan-utils'
import type { CalendarEvent, CalendarLayer } from '@/lib/calendar-utils'
import {
  WEEKDAY_LABELS,
  eventsForDay,
  formatDayLong,
  formatMonthYear,
  getMonthMatrix,
  isToday,
  toISODate,
} from '@/lib/calendar-utils'

interface Props {
  events: CalendarEvent[]
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onEventClick: (event: CalendarEvent) => void
}

function eventToneClass(ev: CalendarEvent): string {
  if (ev.layer === 'geral') return TONE_CLASSES.muted
  return TONE_CLASSES[STATUS_META[ev.status].tone]
}

function EventBar({ event, onClick, compact }: { event: CalendarEvent; onClick: () => void; compact?: boolean }) {
  const tooltip =
    event.start === event.end
      ? `${event.title}\nVence: ${event.end}`
      : `${event.title}\nVence: ${event.end} (período: ${event.start} → ${event.end})`

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`w-full truncate rounded border px-1 text-[10px] font-medium text-left transition-opacity hover:opacity-80 ${eventToneClass(event)} ${compact ? 'py-0' : 'py-0.5'}`}
    >
      {event.title}
    </button>
  )
}

export function CalendarView({ events, year, month, onPrev, onNext, onToday, onEventClick }: Props) {
  const weeks = React.useMemo(() => getMonthMatrix(year, month), [year, month])
  const monthIso = `${year}-${String(month + 1).padStart(2, '0')}`

  const monthEvents = React.useMemo(
    () => events.filter((e) => e.start <= `${monthIso}-31` && e.end >= `${monthIso}-01`),
    [events, monthIso],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrev} aria-label="Mês anterior">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <h2 className="min-w-40 text-center text-base font-semibold text-ink">
            {formatMonthYear(year, month)}
          </h2>
          <Button variant="outline" size="icon" onClick={onNext} aria-label="Próximo mês">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onToday}>
          Hoje
        </Button>
      </div>

      {monthEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-panel p-12 text-center">
          <p className="text-sm font-medium text-ink">Nenhum prazo em {formatMonthYear(year, month)}</p>
          <p className="text-xs text-ink-soft">Ajuste os filtros ou navegue para outro mês.</p>
        </div>
      ) : (
        <>
          {/* Desktop: grid */}
          <div className="hidden overflow-hidden rounded-lg border border-line bg-panel md:block">
            <div className="grid grid-cols-7 border-b border-line bg-line/10">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-line last:border-b-0">
                {week.map((day, di) => {
                  const inMonth = day.getMonth() === month
                  const dayEvents = eventsForDay(monthEvents, day)
                  const visible = dayEvents.slice(0, 3)
                  const more = dayEvents.length - visible.length
                  return (
                    <div
                      key={di}
                      className={`min-h-24 border-r border-line p-1.5 last:border-r-0 ${inMonth ? '' : 'bg-line/5 opacity-50'}`}
                    >
                      <div className={`mb-1 text-xs font-medium ${isToday(day) ? 'flex size-5 items-center justify-center rounded-full bg-teal text-white' : 'text-ink-soft'}`}>
                        {day.getDate()}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {visible.map((ev) => (
                          <EventBar key={`${ev.id}-${toISODate(day)}`} event={ev} onClick={() => onEventClick(ev)} />
                        ))}
                        {more > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              // simples: abre o primeiro evento "oculto"
                              onEventClick(dayEvents[visible.length])
                            }}
                            className="text-left text-[10px] text-ink-soft hover:underline"
                          >
                            +{more} mais
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Mobile: agenda */}
          <div className="flex flex-col gap-4 md:hidden">
            {weeks.flat().filter((d) => d.getMonth() === month).map((day) => {
              const dayEvents = eventsForDay(monthEvents, day)
              if (dayEvents.length === 0) return null
              return (
                <div key={toISODate(day)} className="flex flex-col gap-2">
                  <h3 className={`text-xs font-semibold uppercase tracking-wide ${isToday(day) ? 'text-teal' : 'text-ink-soft'}`}>
                    {formatDayLong(day)}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {dayEvents.map((ev) => (
                      <button
                        key={`${ev.id}-${toISODate(day)}`}
                        type="button"
                        onClick={() => onEventClick(ev)}
                        className={`flex flex-col gap-0.5 rounded-md border p-2 text-left ${eventToneClass(ev)}`}
                      >
                        <span className="text-xs font-medium">{ev.title}</span>
                        <span className="text-[10px] opacity-70">{ev.subtitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}