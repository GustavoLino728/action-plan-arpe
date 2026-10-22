'use client'

import { MessageSquareIcon, RefreshCwIcon, SendIcon, SparklesIcon } from 'lucide-react'
import * as React from 'react'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/plan-utils'
import type { Etapa, LogEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS: Record<LogEntry['type'], typeof MessageSquareIcon> = {
  comentario: MessageSquareIcon,
  status: RefreshCwIcon,
  sistema: SparklesIcon,
}

const TYPE_LABEL: Record<LogEntry['type'], string> = {
  comentario: 'Comentário',
  status: 'Mudança de status',
  sistema: 'Sistema',
}

export function StepTimeline({ etapa }: { etapa: Etapa }) {
  const { addLog } = usePlan()
  const [text, setText] = React.useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    addLog(etapa.id, text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <Field>
          <FieldLabel htmlFor="tl-comment">Novo comentário de execução</FieldLabel>
          <Textarea id="tl-comment" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Descreva o andamento ou registre uma decisão…" />
        </Field>
        <Button type="submit" size="sm" className="self-end" disabled={!text.trim()}>
          <SendIcon data-icon="inline-start" />
          Registrar
        </Button>
      </form>

      <ol className="flex flex-col" aria-label="Histórico de execução">
        {etapa.log.map((entry, idx) => {
          const Icon = ICONS[entry.type]
          return (
            <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
              {idx < etapa.log.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border" />}
              <span
                className={cn(
                  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card',
                  entry.type === 'status' && 'border-info/30 text-info',
                  entry.type === 'comentario' && 'border-gold/50 text-foreground',
                  entry.type === 'sistema' && 'text-muted-foreground',
                )}
              >
                <Icon aria-hidden className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{entry.author}</span>
                  <span>{TYPE_LABEL[entry.type]}</span>
                  <span className="tabular-nums">{formatDate(entry.date)}</span>
                </div>
                <p className="text-sm text-pretty">{entry.text}</p>
              </div>
            </li>
          )
        })}
        {etapa.log.length === 0 && <li className="text-sm text-muted-foreground">Nenhum registro ainda.</li>}
      </ol>
    </div>
  )
}
