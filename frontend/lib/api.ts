import { expectedProgress } from './plan-utils'
import type { Etapa, Iniciativa, Justificativa, KR, PlanData, Status } from './types'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8001'
    : 'http://localhost:8001')

const TOKEN_KEY = 'arpe_auth_token'
const REFRESH_TOKEN_KEY = 'arpe_refresh_token'

export interface UserSession {
  id: string
  name: string
  email: string
  role: string
  department: string | null
  initials: string
}

export interface BackendJustificativa {
  id: string
  etapa_id: string
  data_registro: string
  acao_corretiva: string
  responsavel_acao: string
  previsao_solucao: string
  sob_governanca_arpe: boolean
  resolvido: boolean
}

export interface BackendEtapa {
  id: string
  key_result_id: string
  numero_sequencial: number
  nome_etapa: string
  data_inicio_previsto: string
  data_termino_previsto: string
  data_inicio_realizado: string | null
  data_termino_realizado: string | null
  responsavel_etapa: string
  status: 'A Iniciar' | 'Em Andamento' | 'Concluído' | 'Atrasado'
  justificativa?: BackendJustificativa | null
}

export interface BackendKeyResult {
  id: string
  iniciativa_id: string
  codigo_kr: string
  nome_kr: string
  meta_qualitativa_quantitativa: string
  progresso_percentual: number
  etapas?: BackendEtapa[]
}

export interface BackendIniciativa {
  id: string
  objetivo_id: string
  setor_responsavel: string
  nome_iniciativa: string
  gestor_responsavel: string
  descricao_resumida: string
  valor_estimado_total: string | null
  valor_estimado_ano_vigente: string | null
  key_results?: BackendKeyResult[]
}

export interface Backendobjetivo {
  id: string
  strategic_perspective_id: string
  nome: string
  iniciativas?: BackendIniciativa[]
}

export interface BackendStrategicPerspective {
  id: string
  nome: string
  objetivos?: Backendobjetivo[]
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getInitials(name: string): string {
  if (!name) return 'AR'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Faz login na API com email e senha
 */
export async function login(email = 'admin@arpe.pe.gov.br', password = 'Admin@2026') {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Falha no login (${res.status})`)
  }

  const data = await res.json()
  setStoredTokens(data.access_token, data.refresh_token)
  return data
}

/**
 * Garante que existe um token de autenticação ativo. Se não existir, tenta o login padrão.
 */
export async function ensureAuth(): Promise<string> {
  let token = getStoredToken()
  if (token) return token

  // Tenta autenticação com credenciais padrão do ambiente
  const authData = await login()
  return authData.access_token
}

/**
 * Fetch com autenticação Bearer automática e retry transparente caso token expire
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = await ensureAuth()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Se der 401, tenta renovar token através de re-login
  if (res.status === 401) {
    try {
      clearStoredTokens()
      token = await ensureAuth()
      headers.Authorization = `Bearer ${token}`
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })
    } catch {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => null)
    const message = errJson?.detail || `Erro na requisição ${endpoint}: status ${res.status}`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  if (res.status === 204) {
    return null as T
  }

  return res.json()
}

/**
 * Obtém usuário logado
 */
export async function getMe(): Promise<UserSession> {
  const data = await apiFetch<any>('/api/v1/auth/me')
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role === 'admin' ? 'Administrador' : data.role === 'coordenador' ? 'Coordenador' : 'Servidor',
    department: data.department || 'ARPE',
    initials: getInitials(data.name),
  }
}

/**
 * Converte status do backend para o formato usado no frontend
 */
export function mapBackendStatusToFrontend(status: string): Status {
  switch (status) {
    case 'Concluído':
      return 'concluido'
    case 'Em Andamento':
      return 'em_andamento'
    case 'Atrasado':
      return 'atrasado'
    case 'A Iniciar':
    default:
      return 'a_iniciar'
  }
}

/**
 * Converte status do frontend para o enum do backend
 */
export function mapFrontendStatusToBackend(status: Status): 'A Iniciar' | 'Em Andamento' | 'Concluído' | 'Atrasado' {
  switch (status) {
    case 'concluido':
      return 'Concluído'
    case 'em_andamento':
      return 'Em Andamento'
    case 'atrasado':
      return 'Atrasado'
    case 'a_iniciar':
    default:
      return 'A Iniciar'
  }
}

/**
 * Converte a árvore retornada pelo endpoint /api/v1/strategic-map/tree para o PlanData consumido pelos componentes
 */
export function mapBackendTreeToPlanData(tree: BackendStrategicPerspective[]): {
  data: PlanData
  treeRaw: BackendStrategicPerspective[]
} {
  const iniciativas: Iniciativa[] = []
  const krs: KR[] = []
  const etapas: Etapa[] = []
  const justificativas: Justificativa[] = []

  for (const persp of tree) {
    for (const obj of persp.objetivos || []) {
      for (const ini of obj.iniciativas || []) {
        iniciativas.push({
          id: ini.id,
          strategic_perspective: persp.nome,
          objetivo: obj.nome,
          setor: ini.setor_responsavel,
          nome: ini.nome_iniciativa,
          gestor: ini.gestor_responsavel,
          descricao: ini.descricao_resumida,
          valorTotal: ini.valor_estimado_total || 'A definir',
          valor2026: ini.valor_estimado_ano_vigente || 'A definir',
        })

        for (const kr of ini.key_results || []) {
          krs.push({
            id: kr.id,
            iniciativaId: ini.id,
            nome: kr.nome_kr,
            setor: ini.setor_responsavel,
          })

          for (const etp of kr.etapas || []) {
            const status = mapBackendStatusToFrontend(etp.status)
            etapas.push({
              id: etp.id,
              krId: kr.id,
              numero: etp.numero_sequencial,
              nome: etp.nome_etapa,
              previsto: status === 'concluido' ? 100 : expectedProgress(etp.data_inicio_previsto, etp.data_termino_previsto),
              realizado: status === 'concluido' ? 100 : status === 'a_iniciar' ? 0 : 50,
              responsavel: etp.responsavel_etapa,
              status,
              dataInicio: etp.data_inicio_previsto,
              dataTermino: etp.data_termino_previsto,
              log: [],
            })

            if (etp.justificativa) {
              const j = etp.justificativa
              justificativas.push({
                id: j.id,
                etapaId: etp.id,
                dataRegistro: j.data_registro,
                acaoCorretiva: j.acao_corretiva,
                responsavel: j.responsavel_acao,
                previsaoSolucao: j.previsao_solucao,
                sobGovernanca: j.sob_governanca_arpe,
                resolvido: j.resolvido,
              })
            }
          }
        }
      }
    }
  }

  return {
    data: { iniciativas, krs, etapas, justificativas },
    treeRaw: tree,
  }
}

/**
 * Busca toda a árvore do mapa estratégico
 */
export async function fetchStrategicMapTree(): Promise<BackendStrategicPerspective[]> {
  return apiFetch<BackendStrategicPerspective[]>('/api/v1/strategic-map/tree')
}

/**
 * Cria uma strategic_perspective
 */
export async function createStrategicPerspective(nome: string): Promise<BackendStrategicPerspective> {
  return apiFetch<BackendStrategicPerspective>('/api/v1/strategic_perspectives/', {
    method: 'POST',
    body: JSON.stringify({ nome }),
  })
}

/**
 * Cria um objetivo estratégico
 */
export async function createobjetivo(strategic_perspectiveId: string, nome: string): Promise<Backendobjetivo> {
  return apiFetch<Backendobjetivo>('/api/v1/objetivos/', {
    method: 'POST',
    body: JSON.stringify({ strategic_perspective_id: strategic_perspectiveId, nome }),
  })
}

/**
 * Cria uma iniciativa estratégica
 */
export async function createIniciativa(payload: {
  objetivo_id: string
  setor_responsavel: string
  nome_iniciativa: string
  gestor_responsavel: string
  descricao_resumida: string
  valor_estimado_total?: string | null
  valor_estimado_ano_vigente?: string | null
}): Promise<BackendIniciativa> {
  return apiFetch<BackendIniciativa>('/api/v1/iniciativas/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Cria um Key Result
 */
export async function createKeyResult(payload: {
  iniciativa_id: string
  codigo_kr: string
  nome_kr: string
  meta_qualitativa_quantitativa: string
}): Promise<BackendKeyResult> {
  return apiFetch<BackendKeyResult>('/api/v1/key-results/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Cria uma Etapa do Plano de Ação
 */
export async function createEtapa(payload: {
  key_result_id: string
  numero_sequencial: number
  nome_etapa: string
  data_inicio_previsto: string
  data_termino_previsto: string
  data_inicio_realizado?: string | null
  data_termino_realizado?: string | null
  responsavel_etapa: string
  status: 'A Iniciar' | 'Em Andamento' | 'Concluído' | 'Atrasado'
}): Promise<BackendEtapa> {
  return apiFetch<BackendEtapa>('/api/v1/etapas/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Atualiza o status de uma etapa
 */
export async function updateEtapaStatus(
  etapaId: string,
  payload: {
    status: 'A Iniciar' | 'Em Andamento' | 'Concluído' | 'Atrasado'
    data_inicio_realizado?: string | null
    data_termino_realizado?: string | null
  },
): Promise<BackendEtapa> {
  return apiFetch<BackendEtapa>(`/api/v1/etapas/${etapaId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/**
 * Registra uma justificativa de atraso
 */
export async function createJustificativa(payload: {
  etapa_id: string
  data_registro: string
  acao_corretiva: string
  responsavel_acao: string
  previsao_solucao: string
  sob_governanca_arpe: boolean
  resolvido?: boolean
}): Promise<BackendJustificativa> {
  return apiFetch<BackendJustificativa>('/api/v1/justificativas/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
