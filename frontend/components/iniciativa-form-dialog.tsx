'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Iniciativa, IniciativaInput } from '@/lib/types'

const BLANK: IniciativaInput = {
  strategic_perspective: '',
  objetivo: '',
  setor: '',
  nome: '',
  gestor: '',
  descricao: '',
  valorTotal: 'A definir',
  valor2026: 'A definir',
}

function toInput(i: Iniciativa): IniciativaInput {
  const { id: _id, ...rest } = i
  return rest
}

function IniciativaForm({ existing, onDone }: { existing?: Iniciativa; onDone: () => void }) {
  const { iniciativas, addIniciativa, updateIniciativa } = usePlan()
  const router = useRouter()
  const [values, setValues] = React.useState<IniciativaInput>(() => (existing ? toInput(existing) : BLANK))
  const [errors, setErrors] = React.useState<Partial<Record<keyof IniciativaInput, string>>>({})

  const strategic_perspectives = React.useMemo(() => Array.from(new Set(iniciativas.map((i) => i.strategic_perspective))), [iniciativas])
  const objetivos = React.useMemo(
    () => Array.from(new Set(iniciativas.filter((i) => !values.strategic_perspective || i.strategic_perspective === values.strategic_perspective).map((i) => i.objetivo))),
    [iniciativas, values.strategic_perspective],
  )

  function set<K extends keyof IniciativaInput>(key: K, value: IniciativaInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const er: Partial<Record<keyof IniciativaInput, string>> = {}
    if (!values.strategic_perspective.trim()) er.strategic_perspective = 'Informe a strategic_perspective estratégica.'
    if (!values.objetivo.trim()) er.objetivo = 'Informe o objetivo estratégico.'
    if (!values.setor.trim()) er.setor = 'Informe o setor responsável.'
    if (!values.nome.trim()) er.nome = 'Informe o nome da iniciativa.'
    if (!values.gestor.trim()) er.gestor = 'Informe o gestor responsável.'
    setErrors(er)
    if (Object.keys(er).length > 0) {
      toast.error('Revise os campos destacados.')
      return
    }
    const clean: IniciativaInput = {
      strategic_perspective: values.strategic_perspective.trim(),
      objetivo: values.objetivo.trim(),
      setor: values.setor.trim(),
      nome: values.nome.trim(),
      gestor: values.gestor.trim(),
      descricao: values.descricao.trim(),
      valorTotal: values.valorTotal.trim() || 'A definir',
      valor2026: values.valor2026.trim() || 'A definir',
    }
    try {
      if (existing) {
        await updateIniciativa(existing.id, clean)
        toast.success('Iniciativa atualizada.')
      } else {
        const created = await addIniciativa(clean)
        toast.success('Iniciativa criada. Agora adicione os KRs dos setores.')
        router.push(`/planos/${created.id}`)
      }
      onDone()
    } catch {
      // toast de erro já emitido pelo provider
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col gap-4">
      <datalist id="dl-ini-strategic_perspectives">
        {strategic_perspectives.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <datalist id="dl-ini-objetivos">
        {objetivos.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.strategic_perspective}>
              <FieldLabel htmlFor="if-strategic_perspective">Perspectiva estratégica</FieldLabel>
              <Input id="if-strategic_perspective" list="dl-ini-strategic_perspectives" value={values.strategic_perspective} onChange={(e) => set('strategic_perspective', e.target.value)} aria-invalid={!!errors.strategic_perspective} />
              {errors.strategic_perspective && <FieldError>{errors.strategic_perspective}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.setor}>
              <FieldLabel htmlFor="if-setor">Setor responsável</FieldLabel>
              <Input id="if-setor" value={values.setor} onChange={(e) => set('setor', e.target.value)} aria-invalid={!!errors.setor} placeholder="Ex.: CTI (Coordenadoria de Tecnologia da Informação) / DAF" />
              {errors.setor && <FieldError>{errors.setor}</FieldError>}
            </Field>
          </div>
          <Field data-invalid={!!errors.objetivo}>
            <FieldLabel htmlFor="if-objetivo">Objetivo estratégico</FieldLabel>
            <Input id="if-objetivo" list="dl-ini-objetivos" value={values.objetivo} onChange={(e) => set('objetivo', e.target.value)} aria-invalid={!!errors.objetivo} />
            {errors.objetivo && <FieldError>{errors.objetivo}</FieldError>}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.nome}>
              <FieldLabel htmlFor="if-nome">Nome da iniciativa estratégica</FieldLabel>
              <Input id="if-nome" value={values.nome} onChange={(e) => set('nome', e.target.value)} aria-invalid={!!errors.nome} />
              {errors.nome && <FieldError>{errors.nome}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.gestor}>
              <FieldLabel htmlFor="if-gestor">Gestor responsável</FieldLabel>
              <Input id="if-gestor" value={values.gestor} onChange={(e) => set('gestor', e.target.value)} aria-invalid={!!errors.gestor} />
              {errors.gestor && <FieldError>{errors.gestor}</FieldError>}
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="if-descricao">Descrição resumida da iniciativa estratégica</FieldLabel>
            <Textarea id="if-descricao" rows={4} value={values.descricao} onChange={(e) => set('descricao', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="if-valor-total">Valor estimado total</FieldLabel>
              <Input id="if-valor-total" value={values.valorTotal} onChange={(e) => set('valorTotal', e.target.value)} placeholder="A definir" />
              <FieldDescription>Informe um valor (ex.: 150000) ou &ldquo;A definir&rdquo;.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="if-valor-2026">Valor estimado 2026</FieldLabel>
              <Input id="if-valor-2026" value={values.valor2026} onChange={(e) => set('valor2026', e.target.value)} placeholder="A definir" />
            </Field>
          </div>
        </FieldGroup>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">{existing ? 'Salvar alterações' : 'Criar iniciativa'}</Button>
      </DialogFooter>
    </form>
  )
}

export function IniciativaFormDialog() {
  const { iniciativaForm, closeIniciativaForm, iniciativas } = usePlan()
  const existing = iniciativaForm?.id ? iniciativas.find((i) => i.id === iniciativaForm.id) : undefined

  return (
    <Dialog open={iniciativaForm !== null} onOpenChange={(open) => !open && closeIniciativaForm()}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Editar iniciativa' : 'Nova iniciativa estratégica'}</DialogTitle>
          <DialogDescription>
            {existing ? 'Atualize os dados da iniciativa.' : 'Cadastre a iniciativa. Em seguida, os setores adicionam seus KRs e as etapas de cada KR.'}
          </DialogDescription>
        </DialogHeader>
        {iniciativaForm && <IniciativaForm key={iniciativaForm.id ?? 'new'} existing={existing} onDone={closeIniciativaForm} />}
      </DialogContent>
    </Dialog>
  )
}
