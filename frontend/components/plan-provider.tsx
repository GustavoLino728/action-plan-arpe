'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  type BackendStrategicPerspective,
  createEtapa,
  createIniciativa,
  createJustificativa,
  createKeyResult,
  createobjetivo,
  createStrategicPerspective,
  fetchStrategicMapTree,
  getMe,
  mapBackendTreeToPlanData,
  mapFrontendStatusToBackend,
  updateEtapaStatus,
} from '@/lib/api'
import { CURRENT_USER, type CurrentUserInfo } from '@/lib/current-user'
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
  currentUser: CurrentUserInfo
  reload: () => Promise<void>
  seedDemoData: () => Promise<void>

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
  const [treeRaw, setTreeRaw] = React.useState<BackendStrategicPerspective[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [currentUser, setCurrentUser] = React.useState<CurrentUserInfo>(CURRENT_USER)

  const [query, setQuery] = React.useState('')
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS)
  const [drawer, setDrawer] = React.useState<DrawerState>({ open: false })
  const [iniciativaForm, setIniciativaForm] = React.useState<IniciativaFormState>(null)
  const [krForm, setKrForm] = React.useState<KrFormState>(null)
  const [uploadOpen, setUploadOpen] = React.useState(false)

  // Carrega dados diretamente do backend recém estruturado
  const loadPlan = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [tree, me] = await Promise.all([
        fetchStrategicMapTree(),
        getMe().catch(() => CURRENT_USER),
      ])
      const { data: mapped, treeRaw: raw } = mapBackendTreeToPlanData(tree)
      setData(mapped)
      setTreeRaw(raw)
      if (me) setCurrentUser(me)
    } catch (err: any) {
      console.error('Falha ao sincronizar com backend:', err)
      setError(err.message || 'Falha na conexão com o backend')
      toast.error(`Falha ao conectar ao backend: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadPlan()
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
    () => Array.from(new Set([...treeRaw.map((p) => p.nome), ...iniciativas.map((i) => i.strategic_perspective)])).filter(Boolean),
    [treeRaw, iniciativas],
  )
  const setores = React.useMemo(() => unique(iniciativas.map((i) => i.setor)), [iniciativas])
  const responsaveis = React.useMemo(
    () => unique(etapas.map((e) => e.responsavel)).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [etapas],
  )

  const resetFilters = React.useCallback(() => setFilters(EMPTY_FILTERS), [])

  // Criação de Iniciativa consumindo o backend
  const addIniciativa = React.useCallback(
    async (input: IniciativaInput): Promise<Iniciativa> => {
      try {
        const perspName = input.strategic_perspective.trim()
        let persp = treeRaw.find((p) => p.nome.trim().toLowerCase() === perspName.toLowerCase())
        if (!persp) {
          persp = await createStrategicPerspective(perspName)
        }

        const objName = input.objetivo.trim()
        let obj = persp.objetivos?.find((o) => o.nome.trim().toLowerCase() === objName.toLowerCase())
        if (!obj) {
          obj = await createobjetivo(persp.id, objName)
        }

        const createdBackend = await createIniciativa({
          objetivo_id: obj.id,
          setor_responsavel: input.setor.trim(),
          nome_iniciativa: input.nome.trim(),
          gestor_responsavel: input.gestor.trim(),
          descricao_resumida: input.descricao.trim(),
          valor_estimado_total: input.valorTotal.trim() || null,
          valor_estimado_ano_vigente: input.valor2026.trim() || null,
        })

        await loadPlan(true)

        const created: Iniciativa = {
          ...input,
          id: createdBackend.id,
        }
        return created
      } catch (err: any) {
        toast.error(`Erro ao criar iniciativa no backend: ${err.message}`)
        throw err
      }
    },
    [treeRaw, loadPlan],
  )

  // Atualização de Iniciativa
  const updateIniciativa = React.useCallback(async (id: string, input: IniciativaInput) => {
    // Sinalização: O backend atual não possui endpoint PUT/PATCH /api/v1/iniciativas/{id}
    setData((d) => ({
      ...d,
      iniciativas: d.iniciativas.map((i) => (i.id === id ? { ...input, id } : i)),
    }))
    toast.info('Iniciativa atualizada na visão local. (Sinalização: Backend não expõe endpoint PUT /iniciativas/{id}).')
  }, [])

  // Exclusão de Iniciativa
  const deleteIniciativa = React.useCallback(async (id: string) => {
    // Sinalização: O backend atual não possui endpoint DELETE /api/v1/iniciativas/{id}
    setData((d) => {
      const krIds = new Set(d.krs.filter((k) => k.iniciativaId === id).map((k) => k.id))
      const etapaIds = new Set(d.etapas.filter((e) => krIds.has(e.krId)).map((e) => e.id))
      return {
        iniciativas: d.iniciativas.filter((i) => i.id !== id),
        krs: d.krs.filter((k) => !krIds.has(k.id)),
        etapas: d.etapas.filter((e) => !etapaIds.has(e.id)),
        justificativas: d.justificativas.filter((j) => !etapaIds.has(j.etapaId)),
      }
    })
    setDrawer((s) => (s.open ? { open: false } : s))
    toast.info('Iniciativa removida da visão local. (Sinalização: Backend não expõe endpoint DELETE /iniciativas/{id}).')
  }, [])

  // Criação de KR consumindo o backend
  const addKr = React.useCallback(
    async (input: KRInput): Promise<KR> => {
      try {
        const createdBackend = await createKeyResult({
          iniciativa_id: input.iniciativaId,
          codigo_kr: `KR-${Date.now().toString().slice(-4)}`,
          nome_kr: input.nome.trim(),
          meta_qualitativa_quantitativa: input.setor.trim() || 'Meta 2026',
        })

        await loadPlan(true)

        const created: KR = {
          ...input,
          id: createdBackend.id,
        }
        return created
      } catch (err: any) {
        toast.error(`Erro ao criar KR no backend: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  const updateKr = React.useCallback(async (id: string, input: KRInput) => {
    setData((d) => ({ ...d, krs: d.krs.map((k) => (k.id === id ? { ...input, id } : k)) }))
    toast.info('KR atualizado na visão local. (Sinalização: Backend não expõe endpoint PUT /key-results/{id}).')
  }, [])

  const deleteKr = React.useCallback(async (id: string) => {
    setData((d) => {
      const etapaIds = new Set(d.etapas.filter((e) => e.krId === id).map((e) => e.id))
      return {
        ...d,
        krs: d.krs.filter((k) => k.id !== id),
        etapas: d.etapas.filter((e) => e.krId !== id),
        justificativas: d.justificativas.filter((j) => !etapaIds.has(j.etapaId)),
      }
    })
    setDrawer((s) => (s.open ? { open: false } : s))
    toast.info('KR removido da visão local. (Sinalização: Backend não expõe endpoint DELETE /key-results/{id}).')
  }, [])

  // Criação de Etapa consumindo o backend
  const addEtapa = React.useCallback(
    async (input: EtapaInput): Promise<Etapa> => {
      try {
        const statusBackend = mapFrontendStatusToBackend(input.status)
        const createdBackend = await createEtapa({
          key_result_id: input.krId,
          numero_sequencial: input.numero,
          nome_etapa: input.nome.trim(),
          data_inicio_previsto: input.dataInicio,
          data_termino_previsto: input.dataTermino,
          responsavel_etapa: input.responsavel.trim(),
          status: statusBackend,
        })

        await loadPlan(true)

        const created: Etapa = {
          ...input,
          id: createdBackend.id,
          log: [newLog('sistema', 'Etapa criada no banco de dados.')],
        }
        return created
      } catch (err: any) {
        toast.error(`Erro ao criar etapa no backend: ${err.message}`)
        throw err
      }
    },
    [loadPlan],
  )

  // Atualização de Etapa consumindo o endpoint PATCH /api/v1/etapas/{id}/status do backend
  const updateEtapa = React.useCallback(
    async (id: string, input: EtapaInput) => {
      const previous = data.etapas.find((e) => e.id === id)
      const statusChanged = previous && previous.status !== input.status

      if (statusChanged) {
        try {
          const backendStatus = mapFrontendStatusToBackend(input.status)
          await updateEtapaStatus(id, {
            status: backendStatus,
            data_inicio_realizado: input.status === 'concluido' ? new Date().toISOString().slice(0, 10) : null,
            data_termino_realizado: input.status === 'concluido' ? new Date().toISOString().slice(0, 10) : null,
          })
          await loadPlan(true)
          toast.success(`Status da etapa atualizado para "${input.status}" no backend.`)
          return
        } catch (err: any) {
          toast.error(`Erro ao atualizar status no backend: ${err.message}`)
        }
      }

      // Se alterou apenas outros dados (nome, responsável, datas)
      setData((d) => ({
        ...d,
        etapas: d.etapas.map((e) => {
          if (e.id !== id) return e
          const log = [...e.log]
          if (e.realizado !== input.realizado) {
            log.unshift(newLog('comentario', `Realizado atualizado de ${e.realizado}% para ${input.realizado}%.`))
          }
          return { ...input, id, log }
        }),
      }))
      toast.info('Etapa atualizada na visão local. (Sinalização: Backend dispõe de PATCH para status; faltam endpoints para atualizar nome/datas/responsável).')
    },
    [data.etapas, loadPlan],
  )

  const deleteEtapa = React.useCallback(async (id: string) => {
    setData((d) => ({
      ...d,
      etapas: d.etapas.filter((e) => e.id !== id),
      justificativas: d.justificativas.filter((j) => j.etapaId !== id),
    }))
    setDrawer((s) => (s.open && s.mode !== 'create' && s.id === id ? { open: false } : s))
    toast.info('Etapa removida da visão local. (Sinalização: Backend não expõe endpoint DELETE /etapas/{id}).')
  }, [])

  const addLog = React.useCallback((etapaId: string, text: string) => {
    setData((d) => ({
      ...d,
      etapas: d.etapas.map((e) => (e.id === etapaId ? { ...e, log: [newLog('comentario', text), ...e.log] } : e)),
    }))
  }, [])

  // Criação de Justificativa consumindo o backend POST /api/v1/justificativas/
  const addJustificativa = React.useCallback(
    async (etapaId: string, input: JustificativaInput) => {
      try {
        await createJustificativa({
          etapa_id: etapaId,
          data_registro: input.dataRegistro,
          acao_corretiva: input.acaoCorretiva.trim(),
          responsavel_acao: input.responsavel.trim(),
          previsao_solucao: input.previsaoSolucao,
          sob_governanca_arpe: input.sobGovernanca,
          resolvido: input.resolvido,
        })
        await loadPlan(true)
        toast.success('Justificativa registrada no backend com sucesso.')
      } catch (err: any) {
        toast.error(`Erro ao registrar justificativa no backend: ${err.message}`)
        setData((d) => ({
          ...d,
          justificativas: [{ ...input, id: uid('jus'), etapaId }, ...d.justificativas],
        }))
      }
    },
    [loadPlan],
  )

  const updateJustificativa = React.useCallback(async (id: string, input: JustificativaInput) => {
    setData((d) => ({
      ...d,
      justificativas: d.justificativas.map((j) => (j.id === id ? { ...input, id, etapaId: j.etapaId } : j)),
    }))
    toast.info('Justificativa atualizada localmente. (Sinalização: Backend ainda não dispõe de endpoint para editar/resolver justificativa).')
  }, [])

  const deleteJustificativa = React.useCallback(async (id: string) => {
    setData((d) => ({ ...d, justificativas: d.justificativas.filter((j) => j.id !== id) }))
    toast.info('Justificativa removida da visão local. (Sinalização: Backend não dispõe de DELETE /justificativas/{id}).')
  }, [])

  // Carga em lote diretamente no backend
  const importRows = React.useCallback(
    async (importRowsList: ImportRow[], mode: 'append' | 'replace'): Promise<ImportSummary> => {
      setLoading(true)
      const summary: ImportSummary = { iniciativas: 0, krs: 0, etapas: 0 }
      try {
        let currentTree = await fetchStrategicMapTree()
        const perspMap = new Map<string, BackendStrategicPerspective>()
        for (const p of currentTree) {
          perspMap.set(p.nome.trim().toLowerCase(), p)
        }

        for (const r of importRowsList) {
          // 1. StrategicPerspective
          const pNorm = r.strategic_perspective.trim().toLowerCase()
          let persp = perspMap.get(pNorm)
          if (!persp) {
            persp = await createStrategicPerspective(r.strategic_perspective.trim())
            perspMap.set(pNorm, persp)
          }

          // 2. objetivo
          const oNorm = r.objetivo.trim().toLowerCase()
          let obj = persp.objetivos?.find((o) => o.nome.trim().toLowerCase() === oNorm)
          if (!obj) {
            obj = await createobjetivo(persp.id, r.objetivo.trim())
            if (!persp.objetivos) persp.objetivos = []
            persp.objetivos.push(obj)
          }

          // 3. Iniciativa
          const iNorm = r.iniciativa.trim().toLowerCase()
          let ini = obj.iniciativas?.find((i) => i.nome_iniciativa.trim().toLowerCase() === iNorm)
          if (!ini) {
            ini = await createIniciativa({
              objetivo_id: obj.id,
              setor_responsavel: r.setor.trim() || 'ARPE',
              nome_iniciativa: r.iniciativa.trim(),
              gestor_responsavel: r.gestor.trim() || 'Gestor do Plano',
              descricao_resumida: r.descricao.trim() || r.iniciativa.trim(),
              valor_estimado_total: r.valorTotal.trim() || null,
              valor_estimado_ano_vigente: r.valor2026.trim() || null,
            })
            if (!obj.iniciativas) obj.iniciativas = []
            obj.iniciativas.push(ini)
            summary.iniciativas++
          }

          // 4. KR
          const kNorm = r.kr.trim().toLowerCase()
          let kr = ini.key_results?.find((k) => k.nome_kr.trim().toLowerCase() === kNorm)
          if (!kr) {
            kr = await createKeyResult({
              iniciativa_id: ini.id,
              codigo_kr: `KR-${summary.krs + 1}`,
              nome_kr: r.kr.trim(),
              meta_qualitativa_quantitativa: r.krSetor.trim() || '100%',
            })
            if (!ini.key_results) ini.key_results = []
            ini.key_results.push(kr)
            summary.krs++
          }

          // 5. Etapa
          const statusBackend = mapFrontendStatusToBackend(r.status)
          await createEtapa({
            key_result_id: kr.id,
            numero_sequencial: r.numero ?? ((kr.etapas?.length ?? 0) + 1),
            nome_etapa: r.etapa.trim(),
            data_inicio_previsto: r.dataInicio,
            data_termino_previsto: r.dataTermino,
            responsavel_etapa: r.responsavel.trim(),
            status: statusBackend,
          })
          summary.etapas++
        }

        await loadPlan(true)
        return summary
      } catch (err: any) {
        toast.error(`Erro ao importar para o backend: ${err.message}`)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadPlan],
  )

  // Função utilitária para popular o backend com dados padrão de demonstração do plano 2026 caso o banco esteja vazio
  const seedDemoData = React.useCallback(async () => {
    setLoading(true)
    toast.info('Populando banco de dados no backend com o plano estratégico...')
    try {
      const { PLAN } = await import('@/lib/data')
      for (const iniSeed of PLAN) {
        const persp = await createStrategicPerspective(iniSeed.strategic_perspective)
        const obj = await createobjetivo(persp.id, iniSeed.objetivo)
        const ini = await createIniciativa({
          objetivo_id: obj.id,
          setor_responsavel: iniSeed.setor,
          nome_iniciativa: iniSeed.nome,
          gestor_responsavel: iniSeed.gestor,
          descricao_resumida: iniSeed.descricao,
          valor_estimado_total: iniSeed.valorTotal,
          valor_estimado_ano_vigente: iniSeed.valor2026,
        })

        for (let k = 0; k < iniSeed.krs.length; k++) {
          const krSeed = iniSeed.krs[k]
          const kr = await createKeyResult({
            iniciativa_id: ini.id,
            codigo_kr: `KR-${k + 1}`,
            nome_kr: krSeed.nome,
            meta_qualitativa_quantitativa: krSeed.setor,
          })

          for (let e = 0; e < krSeed.etapas.length; e++) {
            const [nome, , responsavel, status, dataInicio, dataTermino, justs] = krSeed.etapas[e]
            const etapa = await createEtapa({
              key_result_id: kr.id,
              numero_sequencial: e + 1,
              nome_etapa: nome,
              data_inicio_previsto: dataInicio,
              data_termino_previsto: dataTermino,
              responsavel_etapa: responsavel,
              status: mapFrontendStatusToBackend(status),
            })

            if (justs && justs.length > 0) {
              for (const j of justs) {
                await createJustificativa({
                  etapa_id: etapa.id,
                  data_registro: j[0],
                  acao_corretiva: j[1],
                  responsavel_acao: j[2],
                  previsao_solucao: j[3],
                  sob_governanca_arpe: j[4],
                  resolvido: j[5],
                })
              }
            }
          }
        }
      }
      await loadPlan(true)
      toast.success('Plano padrão populado no banco de dados com sucesso!')
    } catch (err: any) {
      toast.error(`Falha ao carregar dados padrão: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [loadPlan])

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
      currentUser,
      reload: () => loadPlan(false),
      seedDemoData,
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
      currentUser,
      loadPlan,
      seedDemoData,
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
