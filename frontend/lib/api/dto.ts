export type BackendStepStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed'

export interface BackendDelayJustificationDTO {
  id: string
  step_id: string
  registration_date: string
  corrective_action: string
  responsible: string
  solution_forecast: string
  under_arpe_governance: boolean
  resolved: boolean
}

export interface BackendActionPlanStepDTO {
  id: string
  key_result_id: string
  sequential_number: number
  name: string
  planned_start_date: string
  planned_end_date: string
  actual_start_date: string | null
  actual_end_date: string | null
  responsible: string
  status: BackendStepStatus
  delay_justifications?: BackendDelayJustificationDTO[]
}

export interface BackendKeyResultDTO {
  id: string
  initiative_id: string
  code: string
  name: string
  goal: string
  percentage_progress: number
  steps?: BackendActionPlanStepDTO[]
}

export interface BackendInitiativeDTO {
  id: string
  strategic_objective_id: string
  responsible_sector: string
  name: string
  responsible_manager: string
  summary: string
  total_estimated_value: string | null
  current_year_estimated_value: string | null
  key_results?: BackendKeyResultDTO[]
}

export interface BackendStrategicObjectiveDTO {
  id: string
  strategic_perspective_id: string
  name: string
  initiatives?: BackendInitiativeDTO[]
}

export interface BackendStrategicPerspectiveDTO {
  id: string
  name: string
  strategic_objectives?: BackendStrategicObjectiveDTO[]
}