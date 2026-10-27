'use client'

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  Loader2Icon,
} from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { usePlan } from '@/components/plan-provider'
import { UploadDropzone } from '@/components/upload-dropzone'
import { Alert, AlertDescription, AlertTitle } from '@/components/alert'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import { cn } from '@/lib/utils'
import { API_BASE_URL, getStoredToken } from '@/lib/api/client'

type Step = 'arquivo' | 'validacao'

type ValidatedRow = Record<string, unknown>
type PreviewIssue = { line: number; field?: string | null; message: string }
type PreviewResponse = {
  valid_rows: ValidatedRow[]
  issues: PreviewIssue[]
  summary: { total_lines: number; valid: number; invalid: number }
}
type ImportCommitResponse = {
  strategic_perspectives_created: number
  strategic_objectives_created: number
  initiatives_created: number
  key_results_created: number
  steps_upserted: number
  steps_deleted: number
  justificativas_upserted: number
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'arquivo', label: 'Arquivo' },
  { id: 'validacao', label: 'Validação' },
]

export function UploadDialog() {
  const { uploadOpen, setUploadOpen, reload } = usePlan()

  const [step, setStep] = React.useState<Step>('arquivo')
  const [fileName, setFileName] = React.useState('')
  const [mode, setMode] = React.useState<'append' | 'replace'>('append')
  const [loading, setLoading] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<PreviewResponse | null>(null)

  function reset() {
    setStep('arquivo')
    setFileName('')
    setMode('append')
    setLoading(false)
    setImporting(false)
    setError(null)
    setResult(null)
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
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(
          typeof errJson.detail === 'string'
            ? errJson.detail
            : `Falha ao processar (${res.status})`,
        )
      }
      const data = (await res.json()) as PreviewResponse
      setFileName(file.name)
      setResult(data)
      setStep('validacao')
    } catch (err: any) {
      setError(err.message || 'Falha ao processar planilha no servidor.')
    } finally {
      setLoading(false)
    }
  }

  async function confirmImport() {
    if (!result || result.valid_rows.length === 0) return
    setImporting(true)
    try {
      const token = getStoredToken()
      const res = await fetch(`${API_BASE_URL}/api/v1/import/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rows: result.valid_rows, mode }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(
          typeof errJson.detail === 'string'
            ? errJson.detail
            : `Falha ao importar (${res.status})`,
        )
      }
      const summary = (await res.json()) as ImportCommitResponse
      const n = summary.steps_upserted
      toast.success(`${n} ${n === 1 ? 'etapa importada' : 'etapas importadas'} com sucesso.`)
      setUploadOpen(false)
      await reload?.()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao importar no servidor. Tente novamente.')
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[min(90vw,48rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>Carga de Planilhas</DialogTitle>
          <DialogDescription>
            Importe um arquivo .xlsx com as abas <strong>PA 01</strong>, <strong>PA 02</strong>, etc.
            A aba "Mapa Estratégico" é ignorada automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper (2 steps) */}
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
          {/* Step 1: arquivo */}
          {step === 'arquivo' && (
            <UploadDropzone
              onFile={handleFile}
              loading={loading}
              error={error}
            />
          )}

          {/* Step 2: validação */}
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
                  Prontas para importação a partir de <strong>{fileName}</strong>.
                  {result.issues.length === 0 && ' Nenhum problema encontrado.'}
                </AlertDescription>
              </Alert>

              {result.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangleIcon />
                  <AlertTitle>
                    {result.issues.length}{' '}
                    {result.issues.length === 1 ? 'linha ignorada' : 'linhas ignoradas'} por
                    inconsistências
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
                <div
                  role="radiogroup"
                  aria-label="Modo de importação"
                  className="inline-flex rounded-md border border-line bg-panel"
                >
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
          {step === 'validacao' && (
            <Button
              variant="outline"
              onClick={() => setStep('arquivo')}
              disabled={importing}
            >
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Button>
          )}

          {step === 'validacao' && result && (
            <Button
              onClick={confirmImport}
              disabled={result.valid_rows.length === 0 || importing}
            >
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