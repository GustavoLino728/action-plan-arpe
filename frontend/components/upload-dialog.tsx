'use client'

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CheckIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
} from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { OptionSelect } from '@/components/option-select'
import { usePlan } from '@/components/plan-provider'
import { UploadDropzone } from '@/components/upload-dropzone'
import { Alert, AlertDescription, AlertTitle } from '@/components/alert'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import {
  FIELD_DEFS,
  SAMPLE_FILE_NAME,
  SAMPLE_GRID,
  autoMap,
  cellToString,
  parseCsv,
  type FieldKey,
  type Grid,
  type Mapping,
} from '@/lib/import-utils'
import { cn } from '@/lib/utils'
import { API_BASE_URL, getStoredToken } from '@/lib/api/client'


type Step = 'arquivo' | 'mapeamento' | 'validacao'

type ValidatedRow = Record<string, unknown>
type PreviewIssue = { line: number; field?: string | null; message: string }
type PreviewResponse = {
  valid_rows: ValidatedRow[]
  issues: PreviewIssue[]
  summary: { total_lines: number; valid: number; invalid: number }
}
type ImportCommitResponse = {
  strategic_perspectives_created: number
  objetivos_created: number
  iniciativas_created: number
  key_results_created: number
  etapas_upserted: number
  etapas_deleted: number
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'arquivo', label: 'Arquivo' },
  { id: 'mapeamento', label: 'Mapeamento' },
  { id: 'validacao', label: 'Validação' },
]

const NONE = 'none'

export function UploadDialog() {
  const { uploadOpen, setUploadOpen, reload } = usePlan()

  const [step, setStep] = React.useState<Step>('arquivo')
  const [fileName, setFileName] = React.useState('')
  const [grid, setGrid] = React.useState<Grid | null>(null)
  const [mapping, setMapping] = React.useState<Mapping>({})
  const [mode, setMode] = React.useState<'append' | 'replace'>('append')
  const [loading, setLoading] = React.useState(false)
  const [previewing, setPreviewing] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<PreviewResponse | null>(null)

  const headers = React.useMemo(
    () => (grid?.[0] ?? []).map((h, i) => cellToString(h) || `Coluna ${i + 1}`),
    [grid],
  )
  const dataRows = React.useMemo(() => grid?.slice(1) ?? [], [grid])

  const missingRequired = FIELD_DEFS.filter(
    (f) => f.required && mapping[f.key] === undefined,
  )

  function reset() {
    setStep('arquivo')
    setFileName('')
    setGrid(null)
    setMapping({})
    setMode('append')
    setLoading(false)
    setPreviewing(false)
    setImporting(false)
    setError(null)
    setResult(null)
  }

  function loadGrid(name: string, data: Grid) {
    if (data.length < 2) {
      setError('A planilha não possui linhas de dados.')
      return
    }
    setFileName(name)
    setGrid(data)
    setMapping(autoMap(data[0].map((h) => cellToString(h))))
    setResult(null)
    setError(null)
    setStep('mapeamento')
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Envie um arquivo .xlsx.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = getStoredToken()
      const res = await fetch(`${API_BASE_URL}/api/v1/import/preview`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setFileName(file.name)
      setResult(data)
      setStep('validacao')
    } catch {
      setError('Falha ao processar planilha no servidor.')
    } finally {
      setLoading(false)
    }
  }

  async function handleValidate() {
    if (!grid) return
    setPreviewing(true)
    setError(null)
    try {
      const token = getStoredToken()
      const res = await fetch(`${API_BASE_URL}/api/v1/import/preview`, {
        method: 'POST',
        headers: token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid, mapping }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as PreviewResponse
      setResult(data)
      setStep('validacao')
    } catch {
      setError('Não foi possível validar a planilha no servidor. Tente novamente.')
    } finally {
      setPreviewing(false)
    }
  }

  async function confirmImport() {
    if (!result || result.valid_rows.length === 0) return
    setImporting(true)
    try {
      const token = getStoredToken()
      const res = await fetch(`${API_BASE_URL}/api/v1/import/commit`, {
        method: 'POST',
        headers: token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: result.valid_rows, mode }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const summary = (await res.json()) as ImportCommitResponse
      const n = summary.etapas_upserted
      toast.success(`${n} ${n === 1 ? 'etapa importada' : 'etapas importadas'} com sucesso.`)
      setUploadOpen(false)
      await reload?.()
    } catch {
      toast.error('Falha ao importar no servidor. Tente novamente.')
    } finally {
      setImporting(false)
    }
  }

  const currentIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <Dialog
      open={uploadOpen}
      onOpenChange={(open) => {
        setUploadOpen(open)
        if (!open) setTimeout(reset, 150)
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[min(90vw,56rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>Carga de Planilhas</DialogTitle>
          <DialogDescription>
            Importe etapas do planejamento estratégico a partir de um arquivo .xlsx ou .csv.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <ol className="flex items-center gap-2 text-sm" aria-label="Etapas da importação">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-2"
              aria-current={s.id === step ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                  i < currentIndex && 'border-success bg-success text-white',
                  i === currentIndex && 'border-teal bg-teal text-white',
                  i > currentIndex && 'text-ink-soft',
                )}
              >
                {i < currentIndex ? <CheckIcon aria-hidden className="size-3.5" /> : i + 1}
              </span>
              <span className={cn(i === currentIndex ? 'font-medium text-ink' : 'text-ink-soft')}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="h-px w-6 bg-line sm:w-10" />
              )}
            </li>
          ))}
        </ol>

        <div className="min-h-0 overflow-y-auto pr-1">
          {step === 'arquivo' && (
            <UploadDropzone
              onFile={handleFile}
              onSample={() => loadGrid(SAMPLE_FILE_NAME, SAMPLE_GRID)}
              loading={loading}
              error={error}
            />
          )}

          {step === 'mapeamento' && grid && (
            <div className="flex flex-col gap-5">
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <FileSpreadsheetIcon aria-hidden className="size-4" />
                <span className="font-medium text-ink">{fileName}</span>
                <span>· {dataRows.length} linhas · {headers.length} colunas</span>
              </p>

              {/* Tabela de mapeamento — HTML puro */}
              <div className="overflow-hidden rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-line/10 text-left text-xs uppercase tracking-wide text-ink-soft">
                      <th className="px-3 py-2 font-medium">Campo do sistema</th>
                      <th className="w-64 px-3 py-2 font-medium">Coluna da planilha</th>
                      <th className="px-3 py-2 font-medium">Exemplo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FIELD_DEFS.map((f) => {
                      const idx = mapping[f.key as keyof typeof mapping]
                      const example =
                        idx === undefined
                          ? ''
                          : dataRows.map((r) => cellToString(r[idx])).find(Boolean) ?? ''
                      const invalid = f.required && idx === undefined
                      return (
                        <tr key={f.key} className="border-t border-line/60">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">{f.label}</span>
                              {f.required && <Badge variant="outline">Obrigatório</Badge>}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <OptionSelect
                              size="sm"
                              ariaLabel={`Coluna para ${f.label}`}
                              invalid={invalid}
                              value={idx === undefined ? NONE : String(idx)}
                              onValueChange={(v) => updateMapping(f.key, v)}
                              options={[
                                { value: NONE, label: 'Não mapear' },
                                ...headers.map((h, i) => ({ value: String(i), label: h })),
                              ]}
                            />
                          </td>
                          <td className="max-w-64 truncate px-3 py-2 text-ink-soft">
                            {example || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Prévia — HTML puro */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-ink">Prévia da planilha</h3>
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-line/10 text-left text-xs uppercase tracking-wide text-ink-soft">
                        <th className="w-10 px-3 py-2 font-medium">#</th>
                        {headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.slice(0, 5).map((r, ri) => (
                        <tr key={ri} className="border-t border-line/60">
                          <td className="px-3 py-2 text-ink-soft">{ri + 2}</td>
                          {headers.map((_, ci) => (
                            <td key={ci} className="max-w-48 truncate px-3 py-2 text-ink">
                              {cellToString(r[ci])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {missingRequired.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangleIcon />
                  <AlertTitle>Mapeamento incompleto</AlertTitle>
                  <AlertDescription>
                    Mapeie os campos obrigatórios: {missingRequired.map((f) => f.label).join(', ')}.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangleIcon />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === 'validacao' && result && (
            <div className="flex flex-col gap-4">
              <Alert>
                <CheckCircle2Icon className="text-success" />
                <AlertTitle>
                  {result.valid_rows.length}{' '}
                  {result.valid_rows.length === 1
                    ? 'linha carregada com sucesso'
                    : 'linhas carregadas com sucesso'}
                </AlertTitle>
                <AlertDescription>
                  Prontas para importação a partir de {fileName}.
                  {result.issues.length === 0 && ' Nenhum problema encontrado.'}
                </AlertDescription>
              </Alert>

              {result.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangleIcon />
                  <AlertTitle>
                    {result.issues.length}{' '}
                    {result.issues.length === 1 ? 'linha ignorada' : 'linhas ignoradas'} por inconsistências
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {result.issues.slice(0, 6).map((issue, i) => (
                        <li key={`${issue.line}-${i}`}>
                          Linha {issue.line}: {issue.message}
                        </li>
                      ))}
                      {result.issues.length > 6 && (
                        <li>… e mais {result.issues.length - 6}.</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-ink">Como deseja importar?</h3>
                {/* ToggleGroup → 2 botões */}
                <div role="radiogroup" aria-label="Modo de importação" className="inline-flex rounded-md border border-line bg-panel">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === 'append'}
                    onClick={() => setMode('append')}
                    className={cn(
                      'rounded-l-md px-3 py-1.5 text-sm transition-colors',
                      mode === 'append' ? 'bg-teal text-white' : 'text-ink hover:bg-line/10',
                    )}
                  >
                    Adicionar aos dados atuais
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === 'replace'}
                    onClick={() => setMode('replace')}
                    className={cn(
                      'rounded-r-md border-l border-line px-3 py-1.5 text-sm transition-colors',
                      mode === 'replace' ? 'bg-teal text-white' : 'text-ink hover:bg-line/10',
                    )}
                  >
                    Substituir todos os dados
                  </button>
                </div>
                {mode === 'replace' && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Todas as etapas atuais serão removidas antes da importação.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step !== 'arquivo' && (
            <Button
              variant="outline"
              onClick={() => setStep(step === 'validacao' ? 'mapeamento' : 'arquivo')}
              disabled={previewing || importing}
            >
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Button>
          )}

          {step === 'mapeamento' && (
            <Button onClick={handleValidate} disabled={missingRequired.length > 0 || previewing}>
              {previewing ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  Validar dados
                  <ArrowRightIcon className="size-4" />
                </>
              )}
            </Button>
          )}

          {step === 'validacao' && result && (
            <Button onClick={confirmImport} disabled={result.valid_rows.length === 0 || importing}>
              {importing ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${result.valid_rows.length} ${result.valid_rows.length === 1 ? 'etapa' : 'etapas'}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}