import type {
  BackendActionPlanStepDTO,
  BackendDelayJustificationDTO,
  BackendInitiativeDTO,
  BackendKeyResultDTO,
  BackendStepStatus,
  BackendStrategicPerspectiveDTO,
} from './dto'
import type { Etapa, Iniciativa, Justificativa, KR, PlanData, Status } from '@/lib/types'
import { expectedProgress } from '@/lib/plan-utils'

const BACKEND_TO_FRONTEND_STATUS: Record<BackendStepStatus, Status> = {
  'Not Started': 'a_iniciar',
  'In Progress': 'em_andamento',
  'Completed': 'concluido',
  'Delayed': 'atrasado',
}

const FRONTEND_TO_BACKEND_STATUS: Record<Status, BackendStepStatus> = {
  a_iniciar: 'Not Started',
  em_andamento: 'In Progress',
  concluido: 'Completed',
  atrasado: 'Delayed',
}

export function toFrontendStatus(s: BackendStepStatus): Status {
  return BACKEND_TO_FRONTEND_STATUS[s] ?? 'a_iniciar'
}

export function toBackendStatus(s: Status): BackendStepStatus {
  return FRONTEND_TO_BACKEND_STATUS[s]
}

export function mapJustificativa(dto: BackendDelayJustificationDTO): Justificativa {
  return {
    id: dto.id,
    etapaId: dto.step_id,
    dataRegistro: dto.registration_date,
    acaoCorretiva: dto.corrective_action,
    responsavel: dto.responsible,
    previsaoSolucao: dto.solution_forecast,
    sobGovernanca: dto.under_arpe_governance,
    resolvido: dto.resolved,
  }
}

export function mapEtapa(dto: BackendActionPlanStepDTO): Etapa {
  const status = toFrontendStatus(dto.status)
  const previsto = status === 'concluido' ? 100 : expectedProgress(dto.planned_start_date, dto.planned_end_date)
  const realizado = status === 'concluido' ? 100 : status === 'a_iniciar' ? 0 : 50

  return {
    id: dto.id,
    krId: dto.key_result_id,
    numero: dto.sequential_number,
    nome: dto.name,
    previsto,
    realizado,
    responsavel: dto.responsible,
    status,
    dataInicio: dto.planned_start_date,
    dataTermino: dto.planned_end_date,
    log: [],
  }
}

export function mapKR(dto: BackendKeyResultDTO, setor: string): KR {
  return {
    id: dto.id,
    iniciativaId: dto.initiative_id,
    nome: dto.name,
    setor,
  }
}

export function mapIniciativa(dto: BackendInitiativeDTO, perspectiva: string, objetivo: string): Iniciativa {
  return {
    id: dto.id,
    strategic_perspective: perspectiva,
    objetivo,
    setor: dto.responsible_sector,
    nome: dto.name,
    gestor: dto.responsible_manager,
    descricao: dto.summary,
    valorTotal: dto.total_estimated_value || 'A definir',
    valor2026: dto.current_year_estimated_value || 'A definir',
  }
}

export function mapBackendTreeToPlanData(tree: BackendStrategicPerspectiveDTO[]): {
  data: PlanData
  treeRaw: BackendStrategicPerspectiveDTO[]
} {
  const iniciativas: Iniciativa[] = []
  const krs: KR[] = []
  const etapas: Etapa[] = []
  const justificativas: Justificativa[] = []

  for (const persp of tree) {
    for (const obj of persp.strategic_objectives ?? []) {
      for (const iniDto of obj.initiatives ?? []) {
        const ini = mapIniciativa(iniDto, persp.name, obj.name)
        iniciativas.push(ini)

        for (const krDto of iniDto.key_results ?? []) {
          krs.push(mapKR(krDto, ini.setor))

          for (const stepDto of krDto.steps ?? []) {
            etapas.push(mapEtapa(stepDto))
            for (const dto of stepDto.delay_justifications ?? []) {
              justificativas.push(mapJustificativa(dto))
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