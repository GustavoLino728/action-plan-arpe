'use client'

import { FileSpreadsheetIcon, UploadCloudIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/button'
import { Spinner } from '@/components/spinner'
import { cn } from '@/lib/utils'

const ACCEPTED = ['.xlsx', '.csv']

export function UploadDropzone({
  onFile,
  onSample,
  loading,
  error,
}: {
  onFile: (file: File) => void
  onSample: () => void
  loading: boolean
  error: string | null
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-teal bg-teal/5' : 'border-line bg-line/5',
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-teal/10 text-teal">
          {loading ? <Spinner /> : <UploadCloudIcon aria-hidden className="size-6" />}
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-ink">Arraste a planilha aqui</p>
          <p className="text-sm text-ink-soft">Formatos aceitos: .xlsx e .csv. A primeira linha deve conter os cabeçalhos.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-label="Selecionar arquivo de planilha"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
        />
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => inputRef.current?.click()} disabled={loading}>
            Selecionar arquivo
          </Button>
          <Button variant="outline" onClick={onSample} disabled={loading}>
            <FileSpreadsheetIcon className="size-4" />
            Usar planilha de exemplo
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}