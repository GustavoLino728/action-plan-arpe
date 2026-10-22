'use client'

import { PencilIcon } from 'lucide-react'
import { JustificativasPanel } from '@/components/justificativas-panel'
import { usePlan } from '@/components/plan-provider'
import { STEP_FORM_ID, StepForm } from '@/components/step-form'
import { StepDetails } from '@/components/step-details'
import { StepTimeline } from '@/components/step-timeline'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function StepDrawer() {
  const { drawer, rows, closeDrawer, openEdit, justSummary } = usePlan()

  const existing = drawer.open && drawer.mode !== 'create' ? rows.find((e) => e.id === drawer.id) : undefined
  const mode = drawer.open ? drawer.mode : 'view'
  const createKrId = drawer.open && drawer.mode === 'create' ? drawer.krId : undefined
  const tab = drawer.open && drawer.mode !== 'create' ? drawer.tab : 'dados'

  const title = mode === 'create' ? 'Nova etapa' : mode === 'edit' ? 'Editar etapa' : (existing?.nome ?? 'Etapa')
  const description =
    mode === 'create'
      ? 'Preencha os dados da etapa deste KR.'
      : existing
        ? `${existing.iniciativa.nome} › ${existing.kr.nome}`
        : undefined

  const key = drawer.open ? (drawer.mode === 'create' ? `create-${drawer.krId}` : `${drawer.mode}-${drawer.id}-${drawer.tab}`) : 'closed'
  const justTotal = existing ? (justSummary[existing.id]?.total ?? 0) : 0

  return (
    <Sheet open={drawer.open} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle className="text-balance">{title}</SheetTitle>
          <SheetDescription className="text-pretty">{description}</SheetDescription>
        </SheetHeader>

        {drawer.open && (createKrId || existing) && (
          <>
            {mode === 'create' && createKrId ? (
              <div key={key} className="flex-1 overflow-y-auto p-4">
                <StepForm krId={createKrId} onDone={closeDrawer} />
              </div>
            ) : existing ? (
              <Tabs defaultValue={tab} key={key} className="min-h-0 flex-1 gap-0">
                <TabsList variant="line" className="mx-4 mt-2 justify-start">
                  <TabsTrigger value="dados">Dados da etapa</TabsTrigger>
                  <TabsTrigger value="justificativas">Justificativas{justTotal > 0 ? ` (${justTotal})` : ''}</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="dados" className="flex-1 overflow-y-auto p-4">
                  {mode === 'edit' ? <StepForm existing={existing} krId={existing.krId} onDone={closeDrawer} /> : <StepDetails etapa={existing} />}
                </TabsContent>
                <TabsContent value="justificativas" className="flex-1 overflow-y-auto p-4">
                  <JustificativasPanel etapa={existing} />
                </TabsContent>
                <TabsContent value="historico" className="flex-1 overflow-y-auto p-4">
                  <StepTimeline etapa={existing} />
                </TabsContent>
              </Tabs>
            ) : null}

            <SheetFooter className="flex-row justify-end border-t">
              {mode === 'view' && existing ? (
                <>
                  <Button variant="outline" onClick={closeDrawer}>
                    Fechar
                  </Button>
                  <Button onClick={() => openEdit(existing.id)}>
                    <PencilIcon data-icon="inline-start" />
                    Editar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={closeDrawer}>
                    Cancelar
                  </Button>
                  <Button type="submit" form={STEP_FORM_ID}>
                    Salvar
                  </Button>
                </>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
