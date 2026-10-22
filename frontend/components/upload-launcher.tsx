'use client'

import { UploadIcon } from 'lucide-react'
import { usePlan } from '@/components/plan-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Importar planilha</CardTitle>
          <CardDescription>Atualmente há {etapas.length} etapas cadastradas no plano.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.title} className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
                <span className="text-sm font-medium">{s.title}</span>
                <span className="text-xs text-pretty text-muted-foreground">{s.text}</span>
              </li>
            ))}
          </ol>
          <Button className="self-start" onClick={() => setUploadOpen(true)}>
            <UploadIcon data-icon="inline-start" />
            Iniciar carga
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colunas esperadas</CardTitle>
          <CardDescription>Nomes alternativos são reconhecidos automaticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1.5 text-sm">
            {FIELD_DEFS.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-2">
                <span>{f.label}</span>
                {f.required && <Badge variant="outline">Obrigatório</Badge>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
