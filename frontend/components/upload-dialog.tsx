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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  FIELD_DEFS,
  SAMPLE_FILE_NAME,
  SAMPLE_GRID,
  autoMap,
  cellToString,
  parseCsv,
  type Grid,
  type Mapping,
} from '@/lib/import-utils'
import { cn } from '@/lib/utils'

// ============================================================
// Contratos do backend (espelham app/domain/import_spreadsheet/schemas.py)
// ============================================================

type Step = 'arquivo' | 'mapeamento' | 'validacao'

type ValidatedRow = Record<string, unknown>

type PreviewIssue = {
  line: number
  field?: string | null
  message: string
}

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

// ============================================================
// Componente
// ============================================================

export function UploadDialog() {
  // `refresh` deve existir no PlanProvider para re-buscar a árvore após o import.
  // Se ainda não existe, adicione: const refresh = () => refetchTree()
  const { uploadOpen, setUploadOpen, refresh } = usePlan()

  const [step, setStep] = React.useState<Step>('arquivo')
  const [fileName, setFileName] = React.useState('')
  const [grid, setGrid] = React.useState<Grid | null>(null)
  const [mapping, setMapping] = React.useState<Mapping>({})
  const [mode, setMode] = React.useState<'append' | 'replace'>('append')

  // Estados de carregamento bem separados por operação
  const [loading, setLoading] = React.useState(false)   // leitura local do arquivo
  const [previewing, setPreviewing] = React.useState(false) // POST /preview
  const [importing, setImporting] = React.useState(false)   // POST /commit
  const [error, setError] = React.useState<string | null>(null)

  // Resultado da validação vindo do BACKEND (nunca computado localmente)
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
    setResult(null) // invalida resultado anterior, se houver
    setError(null)
    setStep('mapeamento')
  }

  async function handleFile(file: File) {
    setError(null)
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
      setError('Formato não suportado. Envie um arquivo .xlsx ou .csv.')
      return
    }
    setLoading(true)
    try {
      if (lower.endsWith('.csv')) {
        loadGrid(file.name, parseCsv(await file.text()))
      } else {
        const { readSheet } = await import('read-excel-file/browser')
        const data = (await readSheet(file)) as Grid
        loadGrid(file.name, data)
      }
    } catch {
      setError(
        'Não foi possível ler o arquivo. Verifique se ele não está corrompido ou protegido por senha.',
      )
    } finally {
      setLoading(false)
    }
  }

  function updateMapping(key: string, value: string) {
    setMapping((m) => {
      const next = { ...m }
      if (value === NONE) delete next[key]
      else next[key] = Number(value)
      return next
    })
    // Qualquer mudança no mapeamento invalida a validação anterior
    setResult(null)
  }

  // ------------------------------------------------------------
  // 1) Preview: o BACKEND valida e normaliza o grid.
  // ------------------------------------------------------------
  async function handleValidate() {
    if (!grid) return
    setPreviewing(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // ------------------------------------------------------------
  // 2) Commit: o BACKEND faz o upsert hierárquico.
  // ------------------------------------------------------------
  async function confirmImport() {
    if (!result || result.valid_rows.length === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/v1/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rows: result.valid_rows, mode }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const summary = (await res.json()) as ImportCommitResponse

      const n = summary.etapas_upserted
      toast.success(
        `${n} ${n === 1 ? 'etapa importada' : 'etapas importadas'} com sucesso.`,
      )
      setUploadOpen(false)
      await refresh?.()
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] sm:max-w-4xl">
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
                  i === currentIndex && 'border-primary bg-primary text-primary-foreground',
                  i > currentIndex && 'text-muted-foreground',
                )}
              >
                {i < currentIndex ? <CheckIcon aria-hidden className="size-3.5" /> : i + 1}
              </span>
              <span className={cn(i === currentIndex ? 'font-medium' : 'text-muted-foreground')}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="h-px w-6 bg-border sm:w-10" />
              )}
            </li>
          ))}
        </ol>

        <div className="min-h-0 overflow-y-auto pr-1">
          {/* ---------------- Step 1: Arquivo ---------------- */}
          {step === 'arquivo' && (
            <UploadDropzone
              onFile={handleFile}
              onSample={() => loadGrid(SAMPLE_FILE_NAME, SAMPLE_GRID)}
              loading={loading}
              error={error}
            />
          )}

          {/* ---------------- Step 2: Mapeamento ---------------- */}
          {step === 'mapeamento' && grid && (
            <div className="flex flex-col gap-5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheetIcon aria-hidden className="size-4" />
                <span className="font-medium text-foreground">{fileName}</span>
                <span>
                  · {dataRows.length} linhas · {headers.length} colunas
                </span>
              </p>

              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Campo do sistema</TableHead>
                      <TableHead className="w-64">Coluna da planilha</TableHead>
                      <TableHead>Exemplo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FIELD_DEFS.map((f) => {
                      const idx = mapping[f.key]
                      const example =
                        idx === undefined
                          ? ''
                          : dataRows.map((r) => cellToString(r[idx])).find(Boolean) ?? ''
                      const invalid = f.required && idx === undefined
                      return (
                        <TableRow key={f.key}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{f.label}</span>
                              {f.required && <Badge variant="outline">Obrigatório</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="max-w-64 truncate text-muted-foreground">
                            {example || '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Prévia da planilha</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-10">#</TableHead>
                        {headers.map((h, i) => (
                          <TableHead key={i}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataRows.slice(0, 5).map((r, ri) => (
                        <TableRow key={ri}>
                          <TableCell className="text-muted-foreground">{ri + 2}</TableCell>
                          {headers.map((_, ci) => (
                            <TableCell key={ci} className="max-w-48 truncate">
                              {cellToString(r[ci])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {missingRequired.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangleIcon />
                  <AlertTitle>Mapeamento incompleto</AlertTitle>
                  <AlertDescription>
                    Mapeie os campos obrigatórios:{' '}
                    {missingRequired.map((f) => f.label).join(', ')}.
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

          {/* ---------------- Step 3: Validação (resultado do BACKEND) ---------------- */}
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
                    {result.issues.length === 1 ? 'linha ignorada' : 'linhas ignoradas'}{' '}
                    por inconsistências
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
                <h3 className="text-sm font-medium">Como deseja importar?</h3>
                <ToggleGroup
                  variant="outline"
                  value={[mode]}
                  onValueChange={(v) => v[0] && setMode(v[0] as 'append' | 'replace')}
                  aria-label="Modo de importação"
                >
                  <ToggleGroupItem value="append">Adicionar aos dados atuais</ToggleGroupItem>
                  <ToggleGroupItem value="replace">Substituir todos os dados</ToggleGroupItem>
                </ToggleGroup>
                {mode === 'replace' && (
                  <p className="text-sm text-destructive">
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
              <ArrowLeftIcon data-icon="inline-start" />
              Voltar
            </Button>
          )}

          {step === 'mapeamento' && (
            <Button
              onClick={handleValidate}
              disabled={missingRequired.length > 0 || previewing}
            >
              {previewing ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Validando...
                </>
              ) : (
                <>
                  Validar dados
                  <ArrowRightIcon data-icon="inline-end" />
                </>
              )}
            </Button>
          )}

          {step === 'validacao' && result && (
            <Button
              onClick={confirmImport}
              disabled={result.valid_rows.length === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Importando...
                </>
              ) : (
                `Importar ${result.valid_rows.length} ${result.valid_rows.length === 1 ? 'etapa' : 'etapas'
                }`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}