import type { Metadata } from 'next'
import { ReportView } from '@/components/report-view'

export const metadata: Metadata = { title: 'Relatórios Executivos' }

export default function RelatoriosPage() {
  return <ReportView />
}
