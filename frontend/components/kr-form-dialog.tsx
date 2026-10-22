'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { KR } from '@/lib/types'

function KrForm({ iniciativaId, existing, onDone }: { iniciativaId: string; existing?: KR; onDone: () => void }) {
  const { iniciativas, setores, addKr, updateKr } = usePlan()
  const iniciativa = iniciativas.find((i) => i.id === iniciativaId)
  const [nome, setNome] = React.useState(existing?.nome ?? '')
  const [setor, setSetor] = React.useState(existing?.setor ?? '')
  const [errors, setErrors] = React.useState<{ nome?: string; setor?: string }>({})

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const er: { nome?: string; setor?: string } = {}
    if (!nome.trim()) er.nome = 'Descreva o KR.'
    if (!setor.trim()) er.setor = 'Informe o setor que está adicionando o KR.'
    setErrors(er)
    if (Object.keys(er).length > 0) return
    const input = { iniciativaId, nome: nome.trim(), setor: setor.trim() }
    try {
      if (existing) {
        await updateKr(existing.id, input)
        toast.success('KR atualizado.')
      } else {
        await addKr(input)
        toast.success('KR adicionado. Agora cadastre as etapas dele.')
      }
      onDone()
    } catch {
      // toast já emitido
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <datalist id="dl-kr-setores">
        {setores.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {iniciativa && (
        <p className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Iniciativa: <span className="font-medium text-foreground">{iniciativa.nome}</span>
        </p>
      )}
      <FieldGroup>
        <Field data-invalid={!!errors.setor}>
          <FieldLabel htmlFor="kr-setor">Setor</FieldLabel>
          <Input id="kr-setor" list="dl-kr-setores" value={setor} onChange={(e) => { setSetor(e.target.value); setErrors((er) => ({ ...er, setor: undefined })) }} aria-invalid={!!errors.setor} placeholder="Ex.: CTI" />
          {errors.setor && <FieldError>{errors.setor}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.nome}>
          <FieldLabel htmlFor="kr-nome">KR (resultado-chave)</FieldLabel>
          <Textarea id="kr-nome" rows={3} value={nome} onChange={(e) => { setNome(e.target.value); setErrors((er) => ({ ...er, nome: undefined })) }} aria-invalid={!!errors.nome} placeholder="Ex.: Renovar 100% dos equipamentos com vida útil excedida" />
          {errors.nome && <FieldError>{errors.nome}</FieldError>}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">{existing ? 'Salvar alterações' : 'Adicionar KR'}</Button>
      </DialogFooter>
    </form>
  )
}

export function KrFormDialog() {
  const { krForm, closeKrForm, krs } = usePlan()
  const existing = krForm?.id ? krs.find((k) => k.id === krForm.id) : undefined

  return (
    <Dialog open={krForm !== null} onOpenChange={(open) => !open && closeKrForm()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Editar KR' : 'Novo KR'}</DialogTitle>
          <DialogDescription>Cada setor adiciona os seus KRs à iniciativa. As etapas são cadastradas dentro de cada KR.</DialogDescription>
        </DialogHeader>
        {krForm && <KrForm key={krForm.id ?? `new-${krForm.iniciativaId}`} iniciativaId={krForm.iniciativaId} existing={existing} onDone={closeKrForm} />}
      </DialogContent>
    </Dialog>
  )
}
