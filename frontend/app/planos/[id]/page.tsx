import type { Metadata } from 'next'
import { IniciativaDetail } from '@/components/iniciativa-detail'

export const metadata: Metadata = { title: 'Iniciativa' }

export default async function IniciativaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <IniciativaDetail id={id} />
}
