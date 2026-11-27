import { apiFetch } from '@/lib/api/client'

// ───────────── DTOs ─────────────

export type ImportMode = 'append' | 'replace'

export interface ValidatedRow {
  [key: string]: unknown
}

export interface PreviewIssue {
  line: number
  field?: string | null
  message: string
}

export interface PreviewResponse {
  valid_rows: ValidatedRow[]
  issues: PreviewIssue[]
  summary: {
    total_lines: number
    valid: number
    invalid: number
    processed_sheets?: string[]
    ignored_sheets?: string[]
  }
}

export interface ImportCommitRequest {
  rows: ValidatedRow[]
  mode: ImportMode
  source_file_name?: string
}

export interface ImportCommitResponse {
  strategic_perspectives_created: number
  strategic_objectives_created: number
  initiatives_created: number
  key_results_created: number
  steps_upserted: number
  steps_deleted: number
  justificativas_upserted: number
  import_id: string
}

export interface ImportUploadItem {
  id: string
  user_id: string | null
  user_name: string
  source_file_name: string | null
  mode: ImportMode
  strategic_perspectives_created: number
  strategic_objectives_created: number
  initiatives_created: number
  key_results_created: number
  steps_upserted: number
  steps_deleted: number
  justificativas_upserted: number
  duration_ms: number | null
  request_id: string | null
  created_at: string
}

export interface ImportUploadList {
  items: ImportUploadItem[]
  total: number
  page: number
  page_size: number
}

// ───────────── Funções ─────────────

export async function previewImport(file: File): Promise<PreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<PreviewResponse>('/api/v1/import/preview', {
    method: 'POST',
    body: formData,
  })
}

export async function commitImport(
  payload: ImportCommitRequest,
): Promise<ImportCommitResponse> {
  return apiFetch<ImportCommitResponse>('/api/v1/import/commit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchImportHistory(params?: {
  page?: number
  page_size?: number
  mode?: ImportMode
  user_id?: string
}): Promise<ImportUploadList> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.page_size) qs.set('page_size', String(params.page_size))
  if (params?.mode) qs.set('mode', params.mode)
  if (params?.user_id) qs.set('user_id', params.user_id)
  const query = qs.toString()
  return apiFetch<ImportUploadList>(
    `/api/v1/import/history${query ? `?${query}` : ''}`,
  )
}