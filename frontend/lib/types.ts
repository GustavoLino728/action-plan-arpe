export type Status = 'concluido' | 'em_andamento' | 'a_iniciar' | 'atrasado'

export interface LogEntry {
  id: string
  date: string
  author: string
  type: 'comentario' | 'status' | 'sistema'
  text: string
}

export interface Iniciativa {
  id: string
  strategic_perspective: string
  objetivo: string
  setor: string
  nome: string
  gestor: string
  descricao: string
  valorTotal: string
  valor2026: string
}

export type IniciativaInput = Omit<Iniciativa, 'id'>

export interface KR {
  id: string
  iniciativaId: string
  nome: string
  setor: string
}

export type KRInput = Omit<KR, 'id'>

export interface Etapa {
  id: string
  krId: string
  numero: number
  nome: string
  previsto: number
  realizado: number
  responsavel: string
  status: Status
  dataInicio: string
  dataTermino: string
  log: LogEntry[]
}

export type EtapaInput = Omit<Etapa, 'id' | 'log'>

export interface Justificativa {
  id: string
  etapaId: string
  dataRegistro: string
  acaoCorretiva: string
  responsavel: string
  previsaoSolucao: string
  sobGovernanca: boolean
  resolvido: boolean
}

export type JustificativaInput = Omit<Justificativa, 'id' | 'etapaId'>

export interface PlanData {
  iniciativas: Iniciativa[]
  krs: KR[]
  etapas: Etapa[]
  justificativas: Justificativa[]
}

export interface EtapaRow extends Etapa {
  kr: KR
  iniciativa: Iniciativa
}

export interface Filters {
  strategic_perspective: string
  setor: string
  responsavel: string
  status: string
  de: string
  ate: string
}

export const EMPTY_FILTERS: Filters = {
  strategic_perspective: 'todas',
  setor: 'todos',
  responsavel: 'todos',
  status: 'todos',
  de: '',
  ate: '',
}
