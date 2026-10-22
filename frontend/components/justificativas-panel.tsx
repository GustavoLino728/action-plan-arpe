'use client'

import { AlertTriangleIcon, CheckIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { usePlan } from '@/components/plan-provider'
import { ToneBadge } from '@/components/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { REFERENCE_DATE, effectiveStatus, formatDate } from '@/lib/plan-utils'
import type { EtapaRow, Justificativa, JustificativaInput } from '@/lib/types'

function YesNo({ id, label, value, onChange }: { id: string; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <ToggleGroup id={id} variant="outline" value={[value ? 'sim' : 'nao']} onValueChange={(v) => v[0] && onChange(v[0] === 'sim')} aria-label={label}>
        <ToggleGroupItem value="sim">Sim</ToggleGroupItem>
        <ToggleGroupItem value="nao">Não</ToggleGroupItem>
      </ToggleGroup>
    </Field>
  )
}

function JustificativaForm({ etapa, existing, onDone }: { etapa: EtapaRow; existing?: Justificativa; onDone: () => void }) {
  const { addJustificativa, updateJustificativa } = usePlan()
  const [values, setValues] = React.useState<JustificativaInput>(() =>
    existing
      ? {
          dataRegistro: existing.dataRegistro,
          acaoCorretiva: existing.acaoCorretiva,
          responsavel: existing.responsavel,
          previsaoSolucao: existing.previsaoSolucao,
          sobGovernanca: existing.sobGovernanca,
          resolvido: existing.resolvido,
        }
      : {
          dataRegistro: REFERENCE_DATE,
          acaoCorretiva: '',
          responsavel: etapa.responsavel,
          previsaoSolucao: '',
          sobGovernanca: true,
          resolvido: false,
        },
  )
  const [errors, setErrors] = React.useState<Partial<Record<keyof JustificativaInput, string>>>({})

  function set<K extends keyof JustificativaInput>(key: K, value: JustificativaInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const er: Partial<Record<keyof JustificativaInput, string>> = {}
    if (!values.dataRegistro) er.dataRegistro = 'Informe a data.'
    if (!values.acaoCorretiva.trim()) er.acaoCorretiva = 'Descreva a ação corretiva.'
    if (!values.responsavel.trim()) er.responsavel = 'Informe o responsável.'
    if (!values.previsaoSolucao) er.previsaoSolucao = 'Informe a previsão.'
    setErrors(er)
    if (Object.keys(er).length > 0) return
    const clean = { ...values, acaoCorretiva: values.acaoCorretiva.trim(), responsavel: values.responsavel.trim() }
    try {
      if (existing) {
        await updateJustificativa(existing.id, clean)
        toast.success('Justificativa atualizada.')
      } else {
        await addJustificativa(etapa.id, clean)
      }
      onDone()
    } catch {
      // toast já emitido
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold">{existing ? 'Editar justificativa' : 'Nova justificativa de atraso'}</h3>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.dataRegistro}>
            <FieldLabel htmlFor="j-data">Data de registro</FieldLabel>
            <Input id="j-data" type="date" value={values.dataRegistro} onChange={(e) => set('dataRegistro', e.target.value)} aria-invalid={!!errors.dataRegistro} />
            {errors.dataRegistro && <FieldError>{errors.dataRegistro}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.previsaoSolucao}>
            <FieldLabel htmlFor="j-previsao">Previsão de solução</FieldLabel>
            <Input id="j-previsao" type="date" value={values.previsaoSolucao} onChange={(e) => set('previsaoSolucao', e.target.value)} aria-invalid={!!errors.previsaoSolucao} />
            {errors.previsaoSolucao && <FieldError>{errors.previsaoSolucao}</FieldError>}
          </Field>
        </div>
        <Field data-invalid={!!errors.acaoCorretiva}>
          <FieldLabel htmlFor="j-acao">Ação corretiva</FieldLabel>
          <Textarea id="j-acao" rows={3} value={values.acaoCorretiva} onChange={(e) => set('acaoCorretiva', e.target.value)} aria-invalid={!!errors.acaoCorretiva} placeholder="O que será feito para recuperar o prazo?" />
          {errors.acaoCorretiva && <FieldError>{errors.acaoCorretiva}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.responsavel}>
          <FieldLabel htmlFor="j-resp">Responsável</FieldLabel>
          <Input id="j-resp" value={values.responsavel} onChange={(e) => set('responsavel', e.target.value)} aria-invalid={!!errors.responsavel} />
          {errors.responsavel && <FieldError>{errors.responsavel}</FieldError>}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <YesNo id="j-gov" label="Sob a governança da ARPE?" value={values.sobGovernanca} onChange={(v) => set('sobGovernanca', v)} />
          <YesNo id="j-res" label="Resolvido?" value={values.resolvido} onChange={(v) => set('resolvido', v)} />
        </div>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          Salvar justificativa
        </Button>
      </div>
    </form>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export function JustificativasPanel({ etapa }: { etapa: EtapaRow }) {
  const { justificativas, updateJustificativa, deleteJustificativa } = usePlan()
  const [editing, setEditing] = React.useState<'new' | string | null>(null)
  const [toDelete, setToDelete] = React.useState<Justificativa | null>(null)

  const list = React.useMemo(
    () => justificativas.filter((j) => j.etapaId === etapa.id).sort((a, b) => b.dataRegistro.localeCompare(a.dataRegistro)),
    [justificativas, etapa.id],
  )
  const late = effectiveStatus(etapa) === 'atrasado'

  function toggleResolved(j: Justificativa) {
    const { id: _id, etapaId: _etapaId, ...input } = j
    updateJustificativa(j.id, { ...input, resolvido: !j.resolvido })
  }

  return (
    <div className="flex flex-col gap-4">
      {late && list.length === 0 && editing !== 'new' && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Etapa em atraso sem justificativa</AlertTitle>
          <AlertDescription>Registre a ação corretiva, o responsável e a previsão de solução para este atraso.</AlertDescription>
        </Alert>
      )}
      {!late && list.length === 0 && editing !== 'new' && (
        <p className="text-sm text-muted-foreground">Esta etapa não está atrasada. Justificativas podem ser registradas quando houver atraso.</p>
      )}

      {editing === 'new' ? (
        <JustificativaForm etapa={etapa} onDone={() => setEditing(null)} />
      ) : (
        late && (
          <Button size="sm" className="self-start" onClick={() => setEditing('new')}>
            <PlusIcon data-icon="inline-start" />
            Registrar justificativa
          </Button>
        )
      )}

      <ul className="flex flex-col gap-3" aria-label="Justificativas de atraso">
        {list.map((j) =>
          editing === j.id ? (
            <li key={j.id}>
              <JustificativaForm etapa={etapa} existing={j} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={j.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <ToneBadge tone={j.resolvido ? 'success' : 'warning'}>{j.resolvido ? 'Resolvido' : 'Em aberto'}</ToneBadge>
                  <ToneBadge tone={j.sobGovernanca ? 'info' : 'muted'}>{j.sobGovernanca ? 'Sob governança da ARPE' : 'Fora da governança da ARPE'}</ToneBadge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleResolved(j)}>
                    <CheckIcon data-icon="inline-start" />
                    {j.resolvido ? 'Reabrir' : 'Marcar resolvido'}
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Editar justificativa" onClick={() => setEditing(j.id)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir justificativa"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setToDelete(j)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-pretty">{j.acaoCorretiva}</p>
              <dl className="grid gap-3 sm:grid-cols-3">
                <Fact label="Data de registro">{formatDate(j.dataRegistro)}</Fact>
                <Fact label="Responsável">{j.responsavel}</Fact>
                <Fact label="Previsão de solução">{formatDate(j.previsaoSolucao)}</Fact>
              </dl>
            </li>
          ),
        )}
      </ul>

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir justificativa?</AlertDialogTitle>
            <AlertDialogDescription>O registro será removido do histórico da etapa. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toDelete) {
                  deleteJustificativa(toDelete.id)
                  toast.success('Justificativa excluída.')
                }
                setToDelete(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
