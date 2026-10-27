'use client'

import { UploadIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { Button } from '@/components/button'

const STEPS = [
  {
    title: '1. Envie o arquivo',
    text: 'Arraste uma planilha .xlsx. Cada aba "PA XX" é lida como uma iniciativa separada.',
  },
  {
    title: '2. Valide o resultado',
    text: 'O servidor extrai os metadados, os KRs, as etapas e as justificativas automaticamente.',
  },
  {
    title: '3. Confirme a importação',
    text: 'Escolha entre adicionar aos dados atuais ou substituir tudo. Pronto.',
  },
]

export function UploadLauncher() {
  const { setUploadOpen, etapas } = usePlan()

  return (
    <div className="rounded-lg border border-line bg-panel p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ink">Importar planilha</h3>
        <p className="text-sm text-ink-soft">
          Atualmente há {etapas.length} etapas cadastradas no plano.
        </p>
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
  )
}