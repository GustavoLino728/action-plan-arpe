'use client'

import { ArrowUpRightIcon, ChevronsDownUpIcon, ChevronsUpDownIcon, SearchXIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { EtapaRow, EtapaRowHeader } from '@/components/etapa-row'
import { usePlan } from '@/components/plan-provider'
import { ProgressBar } from '@/components/progress-bar'
import { ToneBadge } from '@/components/status-bagde'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/accordion'
import { Button } from '@/components/button'
import { averageProgress, buildTree, countByStatus } from '@/lib/plan-utils'
import type { EtapaRow as EtapaRowData } from '@/lib/types'

function NodeSummary({ etapas, krCount }: { etapas: EtapaRowData[]; krCount?: number }) {
  const progress = averageProgress(etapas)
  const counts = countByStatus(etapas)
  return (
    <span className="ml-auto flex shrink-0 items-center gap-3 pr-2">
      {counts.atrasado > 0 && (
        <ToneBadge tone="danger" className="hidden sm:inline-flex">
          {counts.atrasado} {counts.atrasado === 1 ? 'atrasada' : 'atrasadas'}
        </ToneBadge>
      )}
      <span className="hidden text-xs text-ink-soft md:inline">
        {krCount !== undefined && `${krCount} ${krCount === 1 ? 'KR' : 'KRs'} · `}
        {etapas.length} {etapas.length === 1 ? 'etapa' : 'etapas'}
      </span>
      <ProgressBar value={progress} tone={progress === 100 ? 'success' : 'info'} showLabel className="hidden w-28 sm:flex" label="Progresso médio" />
    </span>
  )
}

const pId = (p: string) => `p:${p}`
const oId = (p: string, o: string) => `o:${p}/${o}`
const iId = (id: string) => `i:${id}`

export function TreeView() {
  const { filtered, scopeIniciativas, scopeKrs, searching, loading } = usePlan()
  const tree = React.useMemo(() => buildTree(scopeIniciativas, scopeKrs, filtered), [scopeIniciativas, scopeKrs, filtered])

  const allIds = React.useMemo(() => {
    const ids: string[] = []
    for (const p of tree) {
      ids.push(pId(p.nome))
      for (const o of p.objetivos) {
        ids.push(oId(p.nome, o.nome))
        for (const i of o.iniciativas) ids.push(iId(i.iniciativa.id))
      }
    }
    return ids
  }, [tree])

  const [openIds, setOpenIds] = React.useState<string[]>(() => allIds.filter((id) => id.startsWith('p:') || id.startsWith('o:')))

  React.useEffect(() => {
    if (searching) setOpenIds(allIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching])

  function levelChange(levelIds: string[]) {
    return (next: string[]) => {
      setOpenIds((prev) => [...prev.filter((id) => !levelIds.includes(id)), ...next])
    }
  }

  const pIds = tree.map((p) => pId(p.nome))

  if (loading && tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-line bg-panel p-12 text-ink-soft">
        <div className="size-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        <p className="text-sm">Carregando mapa estratégico do backend...</p>
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-panel p-12 text-center">
        <SearchXIcon className="size-10 text-ink-soft" />
        <h3 className="text-base font-semibold text-ink">Nenhuma iniciativa encontrada</h3>
        <p className="max-w-sm text-sm text-ink-soft">Ajuste a busca ou limpe os filtros para visualizar o mapa estratégico.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">Mapa Estratégico</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenIds(allIds)}>
            <ChevronsUpDownIcon className="size-3.5" />
            Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpenIds([])}>
            <ChevronsDownUpIcon className="size-3.5" />
            Recolher tudo
          </Button>
        </div>
      </div>

      <Accordion multiple value={openIds.filter((id) => pIds.includes(id))} onValueChange={levelChange(pIds)} className="gap-3">
        {tree.map((p) => {
          const oIds = p.objetivos.map((o) => oId(p.nome, o.nome))
          return (
            <AccordionItem key={p.nome} value={pId(p.nome)} className="overflow-hidden rounded-lg border border-l-4 border-line border-l-teal bg-panel px-0">
              <AccordionTrigger className="items-center rounded-none px-4 py-3 text-base hover:no-underline">
                <span className="flex min-w-0 flex-col text-left">
                  <span className="text-[11px] font-medium tracking-wide text-ink-soft uppercase">Perspectiva</span>
                  <span className="font-semibold text-teal">{p.nome}</span>
                </span>
                <NodeSummary etapas={p.etapas} />
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 sm:px-4">
                <Accordion multiple value={openIds.filter((id) => oIds.includes(id))} onValueChange={levelChange(oIds)} className="gap-2">
                  {p.objetivos.map((o) => {
                    const iIds = o.iniciativas.map((i) => iId(i.iniciativa.id))
                    return (
                      <AccordionItem key={o.nome} value={oId(p.nome, o.nome)} className="rounded-md border border-line bg-bg">
                        <AccordionTrigger className="items-center rounded-md px-3 py-2.5 hover:no-underline">
                          <span className="flex min-w-0 flex-col text-left">
                            <span className="text-[11px] font-medium tracking-wide text-ink-soft uppercase">Objetivo estratégico</span>
                            <span className="text-sm font-semibold text-ink">{o.nome}</span>
                          </span>
                          <NodeSummary etapas={o.etapas} />
                        </AccordionTrigger>
                        <AccordionContent className="px-2 pb-2">
                          <Accordion multiple value={openIds.filter((id) => iIds.includes(id))} onValueChange={levelChange(iIds)} className="gap-1.5">
                            {o.iniciativas.map(({ iniciativa, krs, etapas }) => (
                              <AccordionItem key={iniciativa.id} value={iId(iniciativa.id)} className="rounded-md border border-dashed border-line bg-panel">
                                <AccordionTrigger className="items-center rounded-md px-3 py-2 hover:no-underline">
                                  <span className="flex min-w-0 flex-col text-left">
                                    <span className="text-[11px] font-medium tracking-wide text-ink-soft uppercase">Iniciativa</span>
                                    <span className="text-sm font-medium text-ink">{iniciativa.nome}</span>
                                  </span>
                                  <NodeSummary etapas={etapas} krCount={krs.length} />
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-3 px-3 pb-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
                                    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                      <span>Setor: <span className="font-medium text-ink">{iniciativa.setor}</span></span>
                                      <span className="flex items-center gap-1">
                                        <UserIcon aria-hidden className="size-3.5" />
                                        Gestor: <span className="font-medium text-ink">{iniciativa.gestor}</span>
                                      </span>
                                    </span>
                                    <Link
                                      href={`/planos/${iniciativa.id}`}
                                      className="inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium text-teal hover:bg-line/10"
                                    >
                                      Gerenciar iniciativa
                                      <ArrowUpRightIcon className="size-3.5" />
                                    </Link>
                                  </div>

                                  {krs.length === 0 && <p className="text-sm text-ink-soft">Nenhum KR cadastrado para esta iniciativa.</p>}

                                  {krs.map(({ kr, etapas: krEtapas }) => (
                                    <section key={kr.id} aria-label={`KR: ${kr.nome}`} className="rounded-md border border-line bg-bg">
                                      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
                                        <span className="flex min-w-0 flex-col">
                                          <span className="text-[11px] font-medium tracking-wide text-ink-soft uppercase">
                                            KR · {kr.setor || 'Setor não informado'}
                                          </span>
                                          <span className="text-sm font-medium text-balance text-ink">{kr.nome}</span>
                                        </span>
                                        <ProgressBar value={averageProgress(krEtapas)} showLabel className="w-32" label={`Progresso do KR ${kr.nome}`} />
                                      </header>
                                      <div className="py-1.5">
                                        {krEtapas.length === 0 ? (
                                          <p className="px-3 py-1 text-xs text-ink-soft">Nenhuma etapa cadastrada neste KR.</p>
                                        ) : (
                                          <>
                                            <EtapaRowHeader />
                                            <div className="flex flex-col px-1">
                                              {krEtapas.map((e) => <EtapaRow key={e.id} etapa={e} />)}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </section>
                                  ))}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}