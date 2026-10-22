'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { OptionSelect } from '@/components/option-select'
import { usePlan } from '@/components/plan-provider'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { STATUS_META, STATUS_ORDER } from '@/lib/plan-utils'
import type { Etapa, EtapaInput, Status } from '@/lib/types'

export const STEP_FORM_ID = 'step-form'

type Errors = Partial<Record<keyof EtapaInput, string>>

function toInput(e: Etapa): EtapaInput {
  const { id: _id, log: _log, ...rest } = e
  return rest
}

export function StepForm({ existing, krId, onDone }: { existing?: Etapa; krId: string; onDone: () => void }) {
  const { etapas, krs, iniciativas, responsaveis, addEtapa, updateEtapa, addLog } = usePlan()
  const kr = krs.find((k) => k.id === krId)
  const iniciativa = kr && iniciativas.find((i) => i.id === kr.iniciativaId)

  const [values, setValues] = React.useState<EtapaInput>(() =>
    existing
      ? toInput(existing)
      : {
          krId,
          numero: etapas.filter((e) => e.krId === krId).reduce((max, e) => Math.max(max, e.numero), 0) + 1,
          nome: '',
          previsto: 0,
          realizado: 0,
          responsavel: '',
          status: 'a_iniciar',
          dataInicio: '',
          dataTermino: '',
        },
  )
  const [comment, setComment] = React.useState('')
  const [errors, setErrors] = React.useState<Errors>({})

  function set<K extends keyof EtapaInput>(key: K, value: EtapaInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  function changeStatus(status: Status) {
    setValues((v) => ({
      ...v,
      status,
      realizado: status === 'concluido' ? 100 : status === 'a_iniciar' ? 0 : v.realizado,
      previsto: status === 'concluido' ? 100 : v.previsto,
    }))
  }

  function percent(value: string) {
    if (value === '') return 0
    return Math.max(0, Math.min(100, Math.round(Number(value)) || 0))
  }

  function validate() {
    const er: Errors = {}
    if (!Number.isInteger(values.numero) || values.numero < 1) er.numero = 'Nº inválido.'
    if (!values.nome.trim()) er.nome = 'Informe o nome da etapa.'
    if (!values.responsavel.trim()) er.responsavel = 'Informe o responsável pela etapa.'
    if (!values.dataInicio) er.dataInicio = 'Informe a data de início.'
    if (!values.dataTermino) er.dataTermino = 'Informe a data de término.'
    if (values.dataInicio && values.dataTermino && values.dataTermino < values.dataInicio) er.dataTermino = 'O término deve ser posterior ao início.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) {
      toast.error('Revise os campos destacados.')
      return
    }
    const clean: EtapaInput = { ...values, nome: values.nome.trim(), responsavel: values.responsavel.trim() }
    try {
      if (existing) {
        await updateEtapa(existing.id, clean)
        if (comment.trim()) addLog(existing.id, comment.trim())
        toast.success('Etapa atualizada.')
      } else {
        const created = await addEtapa(clean)
        if (comment.trim()) addLog(created.id, comment.trim())
        toast.success('Etapa criada.')
      }
      onDone()
    } catch {
      // toast já emitido
    }
  }

  return (
    <form id={STEP_FORM_ID} onSubmit={handleSubmit} noValidate>
      <datalist id="dl-etapa-responsaveis">
        {responsaveis.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      <FieldGroup>
        {kr && iniciativa && (
          <p className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{iniciativa.nome}</span> › KR: {kr.nome}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
          <Field data-invalid={!!errors.numero}>
            <FieldLabel htmlFor="sf-numero">Nº</FieldLabel>
            <Input id="sf-numero" type="number" min={1} step={1} value={values.numero} onChange={(e) => set('numero', Number(e.target.value))} aria-invalid={!!errors.numero} />
            {errors.numero && <FieldError>{errors.numero}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.nome}>
            <FieldLabel htmlFor="sf-nome">Nome da etapa</FieldLabel>
            <Input id="sf-nome" value={values.nome} onChange={(e) => set('nome', e.target.value)} aria-invalid={!!errors.nome} />
            {errors.nome && <FieldError>{errors.nome}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.responsavel}>
            <FieldLabel htmlFor="sf-responsavel">Responsável pela etapa</FieldLabel>
            <Input id="sf-responsavel" list="dl-etapa-responsaveis" value={values.responsavel} onChange={(e) => set('responsavel', e.target.value)} aria-invalid={!!errors.responsavel} />
            {errors.responsavel && <FieldError>{errors.responsavel}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="sf-status">Status</FieldLabel>
            <OptionSelect
              id="sf-status"
              value={values.status}
              onValueChange={(v) => changeStatus(v as Status)}
              options={STATUS_ORDER.filter((s) => s !== 'atrasado' || values.status === 'atrasado').map((s) => ({ value: s, label: STATUS_META[s].label }))}
            />
            <FieldDescription>O atraso é identificado automaticamente quando o término passa sem conclusão.</FieldDescription>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.dataInicio}>
            <FieldLabel htmlFor="sf-inicio">Data início</FieldLabel>
            <Input id="sf-inicio" type="date" value={values.dataInicio} onChange={(e) => set('dataInicio', e.target.value)} aria-invalid={!!errors.dataInicio} />
            {errors.dataInicio && <FieldError>{errors.dataInicio}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.dataTermino}>
            <FieldLabel htmlFor="sf-termino">Data término</FieldLabel>
            <Input id="sf-termino" type="date" value={values.dataTermino} onChange={(e) => set('dataTermino', e.target.value)} aria-invalid={!!errors.dataTermino} />
            {errors.dataTermino && <FieldError>{errors.dataTermino}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sf-previsto">Previsto (%)</FieldLabel>
            <Input id="sf-previsto" type="number" min={0} max={100} step={1} value={values.previsto} onChange={(e) => set('previsto', percent(e.target.value))} />
            <FieldDescription>Percentual que deveria estar executado até hoje.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="sf-realizado">Realizado (%)</FieldLabel>
            <Input id="sf-realizado" type="number" min={0} max={100} step={1} value={values.realizado} onChange={(e) => set('realizado', percent(e.target.value))} />
            <FieldDescription>Percentual efetivamente executado.</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="sf-comment">Comentário de execução</FieldLabel>
          <Textarea id="sf-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Registre o andamento ou decisões…" />
          <FieldDescription>Será adicionado ao histórico de execução ao salvar.</FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
