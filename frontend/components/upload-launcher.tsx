'use client'

import { UploadIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { FIELD_DEFS } from '@/lib/import-utils'

const STEPS = [
  { title: '1. Envie o arquivo', text: 'Arraste uma planilha .xlsx ou .csv. A primeira linha deve conter os cabeçalhos das colunas.' },
  { title: '2. Mapeie as colunas', text: 'O sistema sugere o mapeamento automaticamente; ajuste o que for necessário.' },
  { title: '3. Valide e importe', text: 'Confira o resumo de linhas válidas e inconsistentes e escolha entre adicionar ou substituir os dados.' },
]

export function UploadLauncher() {
  const { setUploadOpen, etapas } = usePlan()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-line bg-panel p-6 lg:col-span-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-ink">Importar planilha</h3>
          <p className="text-sm text-ink-soft">Atualmente há {etapas.length} etapas cadastradas no plano.</p>
        </div>
        <div className="mt-5 flex flex-col gap-5">
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.title} className="flex flex-col gap-1 rounded-lg border border-line bg-line/10 p-3">
                <span className="text-sm font-medium text-ink">{s.title}</span>
                <span className="text-xs text-pretty text-ink-soft">{s.text}</span>
              </li>
            ))}
          </ol>
          <Button className="self-start" onClick={() => setUploadOpen(true)}>
            <UploadIcon className="size-4" />
            Iniciar carga
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-panel p-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-ink">Colunas esperadas</h3>
          <p className="text-sm text-ink-soft">Nomes alternativos são reconhecidos automaticamente.</p>
        </div>
        <ul className="mt-4 flex flex-col gap-1.5 text-sm">
          {FIELD_DEFS.map((f) => (
            <li key={f.key} className="flex items-center justify-between gap-2">
              <span className="text-ink">{f.label}</span>
              {f.required && <Badge variant="outline">Obrigatório</Badge>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}