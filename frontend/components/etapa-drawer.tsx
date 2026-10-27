'use client'

import * as React from 'react'
import { CheckCircleIcon, PlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { usePlan, type DrawerTab } from '@/components/plan-provider'
import { Button } from '@/components/button'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge } from '@/components/status-bagde'
import {
  TONE_TEXT,
  deadlineInfo,
  effectiveStatus,
  formatDate,
} from '@/lib/plan-utils'
import type { Etapa, Justificativa, Status } from '@/lib/types'
import { cn } from '@/lib/utils'

const labelCls = 'text-xs font-medium text-ink'
const inputCls =
  'h-9 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal'
const textareaCls =
  'min-h-20 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal'

export function EtapaDrawer() {
  const { drawer, closeDrawer } = usePlan()
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const isOpen = drawer.open

  React.useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen && !el.open) el.showModal()
    if (!isOpen && el.open) el.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      onClose={() => closeDrawer()}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeDrawer()
      }}
      className="m-0 ml-auto h-[100dvh] max-h-[100dvh] w-[min(100vw,42rem)] max-w-none rounded-none border-l border-line bg-panel p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      {isOpen && (
        <div className="flex h-full flex-col">
          {drawer.mode === 'create' && (
            <CreatePanel krId={drawer.krId} onClose={closeDrawer} />
          )}
          {drawer.mode === 'edit' && (
            <EditPanel etapaId={drawer.id} onClose={closeDrawer} />
          )}
          {drawer.mode === 'view' && (
            <ViewPanel etapaId={drawer.id} initialTab={drawer.tab} onClose={closeDrawer} />
          )}
        </div>
      )}
    </dialog>
  )
}

/* ---------- Painel de criação ---------- */

function CreatePanel({ krId, onClose }: { krId: string; onClose: () => void }) {
  const { addEtapa, etapas, krs } = usePlan()
  const kr = krs.find((k) => k.id === krId)
  const proximoNumero = etapas.filter((e) => e.krId === krId).length + 1

  const [form, setForm] = React.useState({
    nome: '',
    dataInicio: '',
    dataTermino: '',
    responsavel: '',
    status: 'a_iniciar' as Status,
  })
  const [saving, setSaving] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !form.dataInicio || !form.dataTermino || !form.responsavel.trim()) {
      toast.error('Preencha todos os campos.')
      return
    }
    setSaving(true)
    try {
      await addEtapa({
        krId,
        numero: proximoNumero,
        nome: form.nome,
        previsto: 0,
        realizado: 0,
        responsavel: form.responsavel,
        status: form.status,
        dataInicio: form.dataInicio,
        dataTermino: form.dataTermino,
      })
      toast.success('Etapa criada.')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar etapa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">Nova etapa</span>
          <h2 className="text-lg font-semibold text-ink text-balance">{kr?.nome ?? 'KR'}</h2>
          <span className="text-xs text-ink-soft">Etapa Nº {proximoNumero}</span>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-ink-soft hover:bg-line/10 hover:text-ink" aria-label="Fechar">
          <XIcon className="size-4" />
        </button>
      </header>
      <form id="create-etapa" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome da etapa *</label>
            <input className={inputCls} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data início prevista *</label>
              <input type="date" className={inputCls} value={form.dataInicio} onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data término prevista *</label>
              <input type="date" className={inputCls} value={form.dataTermino} onChange={(e) => setForm((f) => ({ ...f, dataTermino: e.target.value }))} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Responsável *</label>
            <input className={inputCls} value={form.responsavel} onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}>
              <option value="a_iniciar">A Iniciar</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </div>
      </form>
      <footer className="flex justify-end gap-2 border-t border-line p-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" form="create-etapa" disabled={saving}>
          {saving ? 'Salvando...' : 'Criar'}
        </Button>
      </footer>
    </>
  )
}

/* ---------- Painel de edição ---------- */

function EditPanel({ etapaId, onClose }: { etapaId: string; onClose: () => void }) {
  const { etapas, updateEtapa } = usePlan()
  const etapa = etapas.find((e) => e.id === etapaId)

  const [form, setForm] = React.useState(() =>
    etapa
      ? {
          nome: etapa.nome,
          dataInicio: etapa.dataInicio,
          dataTermino: etapa.dataTermino,
          responsavel: etapa.responsavel,
          status: etapa.status,
        }
      : null,
  )
  const [saving, setSaving] = React.useState(false)

  if (!etapa || !form) {
    return (
      <>
        <header className="border-b border-line p-5">
          <h2 className="text-lg font-semibold text-ink">Etapa não encontrada</h2>
        </header>
        <footer className="mt-auto flex justify-end gap-2 border-t border-line p-4">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </footer>
      </>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!etapa || !form) return
    setSaving(true)
    try {
      await updateEtapa(etapaId, {
        krId: etapa.krId,
        numero: etapa.numero,
        nome: form.nome,
        previsto: etapa.previsto,
        realizado: etapa.realizado,
        responsavel: form.responsavel,
        status: form.status,
        dataInicio: form.dataInicio,
        dataTermino: form.dataTermino,
      })
      toast.success('Etapa atualizada.')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar etapa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">Editar etapa Nº {etapa.numero}</span>
          <h2 className="text-lg font-semibold text-ink text-balance">{etapa.nome}</h2>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-ink-soft hover:bg-line/10 hover:text-ink" aria-label="Fechar">
          <XIcon className="size-4" />
        </button>
      </header>
      <form id="edit-etapa" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nome da etapa *</label>
            <input className={inputCls} value={form.nome} onChange={(e) => setForm((f) => f && ({ ...f, nome: e.target.value }))} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data início prevista *</label>
              <input type="date" className={inputCls} value={form.dataInicio} onChange={(e) => setForm((f) => f && ({ ...f, dataInicio: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data término prevista *</label>
              <input type="date" className={inputCls} value={form.dataTermino} onChange={(e) => setForm((f) => f && ({ ...f, dataTermino: e.target.value }))} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Responsável *</label>
            <input className={inputCls} value={form.responsavel} onChange={(e) => setForm((f) => f && ({ ...f, responsavel: e.target.value }))} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm((f) => f && ({ ...f, status: e.target.value as Status }))}>
              <option value="a_iniciar">A Iniciar</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </div>
      </form>
      <footer className="flex justify-end gap-2 border-t border-line p-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" form="edit-etapa" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </footer>
    </>
  )
}

/* ---------- Painel de visualização ---------- */

function ViewPanel({ etapaId, initialTab, onClose }: { etapaId: string; initialTab: DrawerTab; onClose: () => void }) {
  const { etapas, openEdit } = usePlan()
  const etapa = etapas.find((e) => e.id === etapaId)
  const [activeTab, setActiveTab] = React.useState<DrawerTab>(initialTab)

  if (!etapa) {
    return (
      <>
        <header className="border-b border-line p-5">
          <h2 className="text-lg font-semibold text-ink">Etapa não encontrada</h2>
        </header>
        <footer className="mt-auto flex justify-end gap-2 border-t border-line p-4">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </footer>
      </>
    )
  }

  const status = effectiveStatus(etapa)
  const deadline = deadlineInfo(etapa)

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">Etapa Nº {etapa.numero}</span>
          <h2 className="text-lg font-semibold text-ink text-balance">{etapa.nome}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <StatusBadge status={status} />
            <span>·</span>
            <span>{etapa.responsavel}</span>
            <span>·</span>
            <span className={cn('font-medium', TONE_TEXT[deadline.tone])}>{deadline.label}</span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-ink-soft hover:bg-line/10 hover:text-ink" aria-label="Fechar">
          <XIcon className="size-4" />
        </button>
      </header>
      <div className="flex gap-1 border-b border-line px-5">
        {(['dados', 'justificativas', 'historico'] as DrawerTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab ? 'border-teal text-teal' : 'border-transparent text-ink-soft hover:text-ink',
            )}
          >
            {tab === 'dados' && 'Dados'}
            {tab === 'justificativas' && 'Justificativas'}
            {tab === 'historico' && 'Histórico'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'dados' && <DadosTab etapa={etapa} />}
        {activeTab === 'justificativas' && <JustificativasTab etapa={etapa} />}
        {activeTab === 'historico' && <HistoricoTab etapa={etapa} />}
      </div>
      <footer className="flex justify-end gap-2 border-t border-line p-4">
        <Button variant="outline" onClick={onClose}>Fechar</Button>
        <Button onClick={() => openEdit(etapa.id)}>Editar</Button>
      </footer>
    </>
  )
}

function DadosTab({ etapa }: { etapa: Etapa }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Responsável">{etapa.responsavel}</Field>
        <Field label="Status"><StatusBadge status={etapa.status} /></Field>
        <Field label="Data início prevista">{formatDate(etapa.dataInicio)}</Field>
        <Field label="Data término prevista">{formatDate(etapa.dataTermino)}</Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Progresso previsto">
          <ProgressBar value={etapa.previsto} tone="muted" showLabel />
        </Field>
        <Field label="Progresso realizado">
          <ProgressBar
            value={etapa.realizado}
            tone={etapa.status === 'atrasado' ? 'danger' : etapa.status === 'concluido' ? 'success' : 'info'}
            showLabel
          />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  )
}

function JustificativasTab({ etapa }: { etapa: Etapa }) {
  const { justificativas, addJustificativa, updateJustificativa, deleteJustificativa } = usePlan()
  const [adding, setAdding] = React.useState(false)
  const justs = justificativas.filter((j) => j.etapaId === etapa.id)

  const [form, setForm] = React.useState({
    dataRegistro: new Date().toISOString().slice(0, 10),
    acaoCorretiva: '',
    responsavel: etapa.responsavel,
    previsaoSolucao: '',
    sobGovernanca: true,
    resolvido: false,
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.acaoCorretiva.trim()) {
      toast.error('Descreva a ação corretiva.')
      return
    }
    try {
      await addJustificativa(etapa.id, form)
      toast.success('Justificativa registrada.')
      setAdding(false)
      setForm({
        dataRegistro: new Date().toISOString().slice(0, 10),
        acaoCorretiva: '',
        responsavel: etapa.responsavel,
        previsaoSolucao: '',
        sobGovernanca: true,
        resolvido: false,
      })
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {justs.length === 0 && !adding && (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-ink-soft">
          Nenhuma justificativa registrada.
        </div>
      )}

      {justs.map((j: Justificativa) => (
        <div key={j.id} className="flex flex-col gap-2 rounded-md border border-line bg-line/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-soft">
              Registrada em {formatDate(j.dataRegistro)}
            </span>
            <div className="flex gap-1">
              {!j.resolvido && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateJustificativa(j.id, { ...j, resolvido: true })}
                >
                  <CheckCircleIcon className="size-3.5" />
                  Resolver
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 hover:text-rose-600"
                onClick={() => deleteJustificativa(j.id)}
              >
                Remover
              </Button>
            </div>
          </div>
          <p className="text-sm text-ink">{j.acaoCorretiva}</p>
          <div className="grid gap-2 text-xs text-ink-soft sm:grid-cols-2">
            <span>Responsável: {j.responsavel || '—'}</span>
            <span>Previsão: {j.previsaoSolucao ? formatDate(j.previsaoSolucao) : '—'}</span>
            <span>Governança ARPE: {j.sobGovernanca ? 'Sim' : 'Não'}</span>
            <span>Resolvido: {j.resolvido ? 'Sim' : 'Não'}</span>
          </div>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-md border border-line p-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Ação corretiva *</label>
            <textarea
              className={textareaCls}
              value={form.acaoCorretiva}
              onChange={(e) => setForm((f) => ({ ...f, acaoCorretiva: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Data de registro</label>
              <input
                type="date"
                className={inputCls}
                value={form.dataRegistro}
                onChange={(e) => setForm((f) => ({ ...f, dataRegistro: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Responsável</label>
              <input
                className={inputCls}
                value={form.responsavel}
                onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Previsão de solução</label>
              <input
                type="date"
                className={inputCls}
                value={form.previsaoSolucao}
                onChange={(e) => setForm((f) => ({ ...f, previsaoSolucao: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="gov"
                type="checkbox"
                checked={form.sobGovernanca}
                onChange={(e) => setForm((f) => ({ ...f, sobGovernanca: e.target.checked }))}
              />
              <label htmlFor="gov" className="text-xs font-medium text-ink">Sob governança ARPE</label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">Salvar</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="self-start">
          <PlusIcon className="size-4" />
          Adicionar justificativa
        </Button>
      )}
    </div>
  )
}

function HistoricoTab({ etapa }: { etapa: Etapa }) {
  if (etapa.log.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-ink-soft">
        Nenhum histórico registrado.
      </div>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {etapa.log.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-0.5 rounded-md border border-line bg-line/5 p-3">
          <span className="text-xs text-ink-soft">
            {formatDate(entry.date)} · {entry.author}
          </span>
          <p className="text-sm text-ink">{entry.text}</p>
        </li>
      ))}
    </ul>
  )
}