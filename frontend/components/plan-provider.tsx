'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { apiFetch } from '@/lib/api/client'
import { toBackendStatus } from '@/lib/api/mappers'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { BackendStrategicPerspectiveDTO } from '@/lib/api/dto'
import { importRowToBackendPayload } from '@/lib/api/import-mappers'
import {
  createDelayJustification,
  deleteDelayJustification,
  updateDelayJustification,
  createInitiative,
  updateInitiative,
  deleteInitiative,
  createKeyResult,
  updateKeyResult,
  deleteKeyResult,
  createObjective,
  createPerspective,
  createStep,
  updateStep,
  deleteStep,
  fetchStrategicMapTree,
  updateStepStatus,
} from '@/lib/api/services'

import { type ImportRow, type ImportSummary } from '@/lib/import-utils'
import {
  REFERENCE_DATE,
  matchesFilters,
  matchesQuery,
  summarizeJustificativas,
  uid,
  unique,
  type JustificativaSummary,
} from '@/lib/plan-utils'
import {
  EMPTY_FILTERS,
  type Etapa,
  type EtapaInput,
  type EtapaRow,
  type Filters,
  type Iniciativa,
  type IniciativaInput,
  type Justificativa,
  type JustificativaInput,
  type KR,
  type KRInput,
  type LogEntry,
  type PlanData,
} from '@/lib/types'

export type DrawerTab = 'dados' | 'justificativas' | 'historico'

export type DrawerState =
  | { open: false }
  | { open: true; mode: 'view' | 'edit'; id: string; tab: DrawerTab }
  | { open: true; mode: 'create'; krId: string }

export type IniciativaFormState = { id?: string } | null
export type KrFormState = { iniciativaId: string; id?: string } | null

interface PlanContextValue {
  iniciativas: Iniciativa[]
  krs: KR[]
  etapas: Etapa[]
  justificativas: Justificativa[]
  rows: EtapaRow[]
  filtered: EtapaRow[]
  scopeIniciativas: Iniciativa[]
  scopeKrs: KR[]
  justSummary: Record<string, JustificativaSummary>
  strategic_perspectives: string[]
  setores: string[]
  responsaveis: string[]

  query: string
  setQuery: (q: string) => void
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  resetFilters: () => void
  hasActiveFilters: boolean
  searching: boolean

  loading: boolean
  error: string | null
  reload: () => Promise<void>

  addIniciativa: (input: IniciativaInput) => Promise<Iniciativa>
  updateIniciativa: (id: string, input: IniciativaInput) => Promise<void>
  deleteIniciativa: (id: string) => Promise<void>
  addKr: (input: KRInput) => Promise<KR>
  updateKr: (id: string, input: KRInput) => Promise<void>
  deleteKr: (id: string) => Promise<void>
  addEtapa: (input: EtapaInput) => Promise<Etapa>
  updateEtapa: (id: string, input: EtapaInput) => Promise<void>
  deleteEtapa: (id: string) => Promise<void>
  addLog: (etapaId: string, text: string) => void
  addJustificativa: (etapaId: string, input: JustificativaInput) => Promise<void>
  updateJustificativa: (id: string, input: JustificativaInput) => Promise<void>
  deleteJustificativa: (id: string) => Promise<void>
  importRows: (rows: ImportRow[], mode: 'append' | 'replace') => Promise<ImportSummary>

  drawer: DrawerState
  openView: (id: string, tab?: DrawerTab) => void
  openEdit: (id: string) => void
  openCreateEtapa: (krId: string) => void
  closeDrawer: () => void

  iniciativaForm: IniciativaFormState
  openIniciativaForm: (id?: string) => void
  closeIniciativaForm: () => void
  krForm: KrFormState
  openKrForm: (iniciativaId: string, id?: string) => void
  closeKrForm: () => void

  uploadOpen: boolean
  setUploadOpen: (open: boolean) => void
}

const PlanContext = React.createContext<PlanContextValue | null>(null)

export function usePlan() {
  const ctx = React.useContext(PlanContext)
  if (!ctx) throw new Error('usePlan deve ser usado dentro de <PlanProvider>')
  return ctx
}

function newLog(type: LogEntry['type'], text: string, author = 'Você'): LogEntry {
  return { id: uid('log'), date: REFERENCE_DATE, author, type, text }
}

const EMPTY_DATA: PlanData = { iniciativas: [], krs: [], etapas: [], justificativas: [] }

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<PlanData>(EMPTY_DATA)
  const [treeRaw, setTreeRaw] = React.useState<BackendStrategicPerspectiveDTO[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  const [query, setQuery] = React.useState('')
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS)
  const [drawer, setDrawer] = React.useState<DrawerState>({ open: false })
  const [iniciativaForm, setIniciativaForm] = React.useState<IniciativaFormState>(null)
  const [krForm, setKrForm] = React.useState<KrFormState>(null)
  const [uploadOpen, setUploadOpen] = React.useState(false)

  const loadPlan = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const result = await fetchStrategicMapTree()
      setData(result.data)
      setTreeRaw(result.treeRaw)
    } catch (err: any) {
      console.error('Falha ao sincronizar com backend:', err)
      setError(err.message || 'Falha na conexão com o backend')
      toast.error(`Falha ao conectar ao backend: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      loadPlan()
    }
  }, [loadPlan])

  const { iniciativas, krs, etapas, justificativas } = data

  const rows = React.useMemo<EtapaRow[]>(() => {
    const krById = new Map(krs.map((k) => [k.id, k]))
    const iniById = new Map(iniciativas.map((i) => [i.id, i]))
    const out: EtapaRow[] = []
    for (const e of etapas) {
      const kr = krById.get(e.krId)
      const iniciativa = kr && iniById.get(kr.iniciativaId)
      if (kr && iniciativa) out.push({ ...e, kr, iniciativa })
    }
    return out
  }, [etapas, krs, iniciativas])

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)
  const searching = query.trim() !== '' || hasActiveFilters

  const filtered = React.useMemo(
    () => rows.filter((r) => matchesQuery(r, query) && matchesFilters(r, filters)),
    [rows, query, filters],
  )

  const { scopeIniciativas, scopeKrs } = React.useMemo(() => {
    if (!searching) return { scopeIniciativas: iniciativas, scopeKrs: krs }
    const krIds = new Set(filtered.map((r) => r.krId))
    const iniIds = new Set(filtered.map((r) => r.iniciativa.id))
    return {
      scopeIniciativas: iniciativas.filter((i) => iniIds.has(i.id)),
      scopeKrs: krs.filter((k) => krIds.has(k.id)),
    }
  }, [searching, filtered, iniciativas, krs])

  const justSummary = React.useMemo(() => summarizeJustificativas(justificativas), [justificativas])
  const strategic_perspectives = React.useMemo(
    () =>
      Array.from(
        new Set([...treeRaw.map((p) => p.name), ...iniciativas.map((i) => i.strategic_perspective)]),
      ).filter(Boolean),
    [treeRaw, iniciativas],
  )
  const setores = React.useMemo(() => unique(iniciativas.map((i) => i.setor)), [iniciativas])
  const responsaveis = React.useMemo(
    () => unique(etapas.map((e) => e.responsavel)).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [etapas],
  )

  const resetFilters = React.useCallback(() => setFilters(EMPTY_FILTERS), [])

  const addIniciativa = React.useCallback(
    async (input: IniciativaInput): Promise<Iniciativa> => {
      try {
        const perspName = input.strategic_perspective.trim()
        let persp = treeRaw.find((p) => p.name.trim().toLowerCase() === perspName.toLowerCase())
        if (!persp) {
          persp = await createPerspective(perspName)
        }

        const objName = input.objetivo.trim()
        let obj = persp.strategic_objectives?.find(
          (o) => o.name.trim().toLowerCase() === objName.toLowerCase(),
        )
        if (!obj) {
          obj = await createObjective(persp.id, objName)
        }

        const createdBackend = await createInitiative({
          strategic_objective_id: obj.id,
          responsible_sector: input.setor.trim(),
          name: input.nome.trim(),
          responsible_manager: input.gestor.trim(),
          summary: input.descricao.trim(),
          total_estimated_value: input.valorTotal.trim() || null,
          current_year_estimated_value: input.valor2026.trim() || null,
        })

        await loadPlan(true)
        return { ...input, id: createdBackend.id }
      } catch (err: any) {
        toast.error(`Erro ao criar iniciativa no backend: ${err.message}`)
        throw err
      }
    },
    [treeRaw, loadPlan],
  )

  const updateIniciativa = React.useCallback(
    async (id: string, input: IniciativaInput) => {
      try {
        await updateInitiative(id, {
          responsible_sector: input.setor.trim(),
          name: input.nome.trim(),
          responsible_manager: input.gestor.trim(),
          summary: input.descricao.trim(),
          total_estimated_value: input.valorTotal.trim() || null,
          current_year_estimated_value: input.valor2026.trim() || null,
        })
        await loadPlan(true)
        toast.success('Iniciativa atualizada.')
      } catch (err: any) {
        toast.error(`Erro ao atualizar iniciativa: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const deleteIniciativa = React.useCallback(
    async (id: string) => {
      try {
        await deleteIniciativa(id)
        await loadPlan(true)
        setDrawer((s) => (s.open ? { open: false } : s))
        toast.success('Iniciativa removida.')
      } catch (err: any) {
        toast.error(`Erro ao remover iniciativa: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const addKr = React.useCallback(
    async (input: KRInput): Promise<KR> => {
      try {
        const createdBackend = await createKeyResult({
          initiative_id: input.iniciativaId,
          code: `KR-${Date.now().toString().slice(-4)}`,
          name: input.nome.trim(),
          goal: input.setor.trim() || 'Meta 2026',
        })
        await loadPlan(true)
        return { ...input, id: createdBackend.id }
      } catch (err: any) {
        toast.error(`Erro ao criar KR no backend: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const updateKr = React.useCallback(
    async (id: string, input: KRInput) => {
      try {
        await updateKeyResult(id, {
          name: input.nome.trim(),
          goal: input.setor.trim() || 'Meta 2026',
        })
        await loadPlan(true)
        toast.success('KR atualizado.')
      } catch (err: any) {
        toast.error(`Erro ao atualizar KR: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const deleteKr = React.useCallback(
    async (id: string) => {
      try {
        await deleteKeyResult(id)
        await loadPlan(true)
        setDrawer((s) => (s.open ? { open: false } : s))
        toast.success('KR removido.')
      } catch (err: any) {
        toast.error(`Erro ao remover KR: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const addEtapa = React.useCallback(
    async (input: EtapaInput): Promise<Etapa> => {
      try {
        const createdBackend = await createStep({
          key_result_id: input.krId,
          sequential_number: input.numero,
          name: input.nome.trim(),
          planned_start_date: input.dataInicio,
          planned_end_date: input.dataTermino,
          responsible: input.responsavel.trim(),
          status: input.status,
        })
        await loadPlan(true)
        return {
          ...input,
          id: createdBackend.id,
          log: [newLog('sistema', 'Etapa criada no banco de dados.')],
        }
      } catch (err: any) {
        toast.error(`Erro ao criar etapa no backend: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const updateEtapa = React.useCallback(
    async (id: string, input: EtapaInput) => {
      try {
        await updateStep(id, {
          name: input.nome.trim(),
          planned_start_date: input.dataInicio,
          planned_end_date: input.dataTermino,
          responsible: input.responsavel.trim(),
          status: toBackendStatus(input.status),
          actual_start_date:
            input.status === 'concluido' ? new Date().toISOString().slice(0, 10) : null,
          actual_end_date:
            input.status === 'concluido' ? new Date().toISOString().slice(0, 10) : null,
        })
        await loadPlan(true)
        toast.success('Etapa atualizada.')
      } catch (err: any) {
        toast.error(`Erro ao atualizar etapa: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const deleteEtapa = React.useCallback(
    async (id: string) => {
      try {
        await deleteStep(id)
        await loadPlan(true)
        setDrawer((s) =>
          s.open && s.mode !== 'create' && s.id === id ? { open: false } : s,
        )
        toast.success('Etapa removida.')
      } catch (err: any) {
        toast.error(`Erro ao remover etapa: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const addLog = React.useCallback((etapaId: string, text: string) => {
    setData((d) => ({
      ...d,
      etapas: d.etapas.map((e) =>
        e.id === etapaId ? { ...e, log: [newLog('comentario', text), ...e.log] } : e,
      ),
    }))
  }, [])

  const addJustificativa = React.useCallback(
    async (etapaId: string, input: JustificativaInput) => {
      if (!input.previsaoSolucao) {
        toast.error('Previsão de solução é obrigatória.')
        return
      }
      if (!input.acaoCorretiva.trim()) {
        toast.error('Ação corretiva é obrigatória.')
        return
      }
      try {
        await createDelayJustification({
          step_id: etapaId,
          registration_date: input.dataRegistro,
          corrective_action: input.acaoCorretiva.trim(),
          responsible: input.responsavel.trim(),
          solution_forecast: input.previsaoSolucao,
          under_arpe_governance: input.sobGovernanca,
          resolved: input.resolvido,
        })
        await loadPlan(true)
        toast.success('Justificativa registrada no backend com sucesso.')
      } catch (err: any) {
        toast.error(`Erro ao registrar justificativa: ${err.message}`)
      }
    },
    [loadPlan],
  )

  const updateJustificativa = React.useCallback(
    async (id: string, input: JustificativaInput) => {
      try {
        await updateDelayJustification(id, {
          registration_date: input.dataRegistro,
          corrective_action: input.acaoCorretiva.trim(),
          responsible: input.responsavel.trim(),
          solution_forecast: input.previsaoSolucao,
          under_arpe_governance: input.sobGovernanca,
          resolved: input.resolvido,
        })
        await loadPlan(true)
        toast.success('Justificativa atualizada.')
      } catch (err: any) {
        toast.error(`Erro ao atualizar justificativa: ${err.message}`)
        setData((d) => ({
          ...d,
          justificativas: d.justificativas.map((j) =>
            j.id === id ? { ...input, id, etapaId: j.etapaId } : j,
          ),
        }))
      }
    },
    [loadPlan],
  )

  const deleteJustificativa = React.useCallback(
    async (id: string) => {
      try {
        await deleteDelayJustification(id)
        await loadPlan(true)
        toast.success('Justificativa removida.')
      } catch (err: any) {
        toast.error(`Erro ao remover justificativa: ${err.message}`)
        setData((d) => ({
          ...d,
          justificativas: d.justificativas.filter((j) => j.id !== id),
        }))
      }
    },
    [loadPlan],
  )

  const importRows = React.useCallback(
    async (importRowsList: ImportRow[], mode: 'append' | 'replace'): Promise<ImportSummary> => {
      setLoading(true)
      try {
        const backendRows = importRowsList.map(importRowToBackendPayload)
        const result = await apiFetch<{
          perspectivas_created: number
          objetivos_created: number
          iniciativas_created: number
          key_results_created: number
          etapas_upserted: number
          etapas_deleted: number
        }>(API_ENDPOINTS.imports.commit, {
          method: 'POST',
          body: JSON.stringify({ rows: backendRows, mode }),
        })
        await loadPlan(true)
        return {
          iniciativas: result.iniciativas_created,
          krs: result.key_results_created,
          etapas: result.etapas_upserted,
        }
      } catch (err: any) {
        toast.error(`Erro ao importar para o backend: ${err.message}`)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadPlan],
  )

  const value = React.useMemo<PlanContextValue>(
    () => ({
      iniciativas,
      krs,
      etapas,
      justificativas,
      rows,
      filtered,
      scopeIniciativas,
      scopeKrs,
      justSummary,
      strategic_perspectives,
      setores,
      responsaveis,
      query,
      setQuery,
      filters,
      setFilters,
      resetFilters,
      hasActiveFilters,
      searching,
      loading,
      error,
      reload: () => loadPlan(false),
      addIniciativa,
      updateIniciativa,
      deleteIniciativa,
      addKr,
      updateKr,
      deleteKr,
      addEtapa,
      updateEtapa,
      deleteEtapa,
      addLog,
      addJustificativa,
      updateJustificativa,
      deleteJustificativa,
      importRows,
      drawer,
      openView: (id, tab = 'dados') => setDrawer({ open: true, mode: 'view', id, tab }),
      openEdit: (id) => setDrawer({ open: true, mode: 'edit', id, tab: 'dados' }),
      openCreateEtapa: (krId) => setDrawer({ open: true, mode: 'create', krId }),
      closeDrawer: () => setDrawer({ open: false }),
      iniciativaForm,
      openIniciativaForm: (id) => setIniciativaForm({ id }),
      closeIniciativaForm: () => setIniciativaForm(null),
      krForm,
      openKrForm: (iniciativaId, id) => setKrForm({ iniciativaId, id }),
      closeKrForm: () => setKrForm(null),
      uploadOpen,
      setUploadOpen,
    }),
    [
      iniciativas,
      krs,
      etapas,
      justificativas,
      rows,
      filtered,
      scopeIniciativas,
      scopeKrs,
      justSummary,
      strategic_perspectives,
      setores,
      responsaveis,
      query,
      filters,
      resetFilters,
      hasActiveFilters,
      searching,
      loading,
      error,
      loadPlan,
      addIniciativa,
      updateIniciativa,
      deleteIniciativa,
      addKr,
      updateKr,
      deleteKr,
      addEtapa,
      updateEtapa,
      deleteEtapa,
      addLog,
      addJustificativa,
      updateJustificativa,
      deleteJustificativa,
      importRows,
      drawer,
      iniciativaForm,
      krForm,
      uploadOpen,
    ],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}