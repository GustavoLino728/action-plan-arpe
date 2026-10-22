import { REFERENCE_DATE, expectedProgress, normalize, uid } from './plan-utils'
import type { Etapa, Iniciativa, KR, PlanData, Status } from './types'

export type Cell = string | number | boolean | Date | null | undefined
export type Grid = Cell[][]

export type FieldKey =
  | 'strategic_perspective'
  | 'objetivo'
  | 'setor'
  | 'iniciativa'
  | 'gestor'
  | 'descricao'
  | 'valorTotal'
  | 'valor2026'
  | 'kr'
  | 'krSetor'
  | 'numero'
  | 'etapa'
  | 'previsto'
  | 'realizado'
  | 'responsavel'
  | 'status'
  | 'dataInicio'
  | 'dataTermino'

export interface FieldDef {
  key: FieldKey
  label: string
  group: 'Iniciativa' | 'KR' | 'Etapa'
  required: boolean
  aliases: string[]
}

export const FIELD_DEFS: FieldDef[] = [
  { key: 'strategic_perspective', label: 'StrategicPerspective estratégica', group: 'Iniciativa', required: true, aliases: ['strategic_perspective', 'strategic_perspective estrategica'] },
  { key: 'objetivo', label: 'objetivo estratégico', group: 'Iniciativa', required: true, aliases: ['objetivo', 'objetivo estrategico'] },
  { key: 'setor', label: 'Setor responsável', group: 'Iniciativa', required: false, aliases: ['setor responsavel', 'setor da iniciativa', 'setor'] },
  { key: 'iniciativa', label: 'Nome da iniciativa estratégica', group: 'Iniciativa', required: true, aliases: ['iniciativa', 'iniciativa estrategica', 'nome da iniciativa', 'nome da iniciativa estrategica', 'projeto'] },
  { key: 'gestor', label: 'Gestor responsável', group: 'Iniciativa', required: false, aliases: ['gestor', 'gestor responsavel'] },
  { key: 'descricao', label: 'Descrição resumida', group: 'Iniciativa', required: false, aliases: ['descricao', 'descricao resumida', 'descricao resumida da iniciativa estrategica', 'descricao da iniciativa'] },
  { key: 'valorTotal', label: 'Valor estimado total', group: 'Iniciativa', required: false, aliases: ['valor estimado total', 'valor total', 'valor'] },
  { key: 'valor2026', label: 'Valor estimado 2026', group: 'Iniciativa', required: false, aliases: ['valor estimado 2026', 'valor 2026'] },
  { key: 'kr', label: 'KR (resultado-chave)', group: 'KR', required: true, aliases: ['kr', 'krs', 'key result', 'resultado chave', 'nome do kr'] },
  { key: 'krSetor', label: 'Setor do KR', group: 'KR', required: false, aliases: ['setor do kr', 'setor kr', 'setor do krs'] },
  { key: 'numero', label: 'Nº da etapa', group: 'Etapa', required: false, aliases: ['n', 'no', 'numero', 'num', 'n da etapa'] },
  { key: 'etapa', label: 'Nome da etapa', group: 'Etapa', required: true, aliases: ['etapa', 'nome da etapa', 'acao', 'atividade'] },
  { key: 'previsto', label: 'Previsto (%)', group: 'Etapa', required: false, aliases: ['previsto', 'previsto %', 'percentual previsto'] },
  { key: 'realizado', label: 'Realizado (%)', group: 'Etapa', required: false, aliases: ['realizado', 'realizado %', 'percentual realizado'] },
  { key: 'responsavel', label: 'Responsável pela etapa', group: 'Etapa', required: true, aliases: ['responsavel pela etapa', 'responsavel etapa', 'responsavel'] },
  { key: 'status', label: 'Status', group: 'Etapa', required: false, aliases: ['status', 'situacao'] },
  { key: 'dataInicio', label: 'Data de início', group: 'Etapa', required: false, aliases: ['data inicio', 'data de inicio', 'inicio'] },
  { key: 'dataTermino', label: 'Data de término', group: 'Etapa', required: true, aliases: ['data termino', 'data de termino', 'termino', 'prazo'] },
]

export type Mapping = Partial<Record<FieldKey, number>>

function normalizeHeader(h: string) {
  return normalize(h)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function autoMap(headers: string[]): Mapping {
  const normalized = headers.map(normalizeHeader)
  const mapping: Mapping = {}
  const used = new Set<number>()
  for (const def of FIELD_DEFS) {
    const idx = normalized.findIndex((h, i) => !used.has(i) && def.aliases.includes(h))
    if (idx >= 0) {
      mapping[def.key] = idx
      used.add(idx)
    }
  }
  return mapping
}

export function cellToString(cell: Cell): string {
  if (cell === null || cell === undefined) return ''
  if (cell instanceof Date) return cell.toISOString().slice(0, 10)
  return String(cell).trim()
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function parseDateCell(cell: Cell): string | null {
  if (cell === null || cell === undefined || cell === '') return ''
  if (cell instanceof Date) {
    if (Number.isNaN(cell.getTime())) return null
    return `${cell.getUTCFullYear()}-${pad(cell.getUTCMonth() + 1)}-${pad(cell.getUTCDate())}`
  }
  if (typeof cell === 'number') {
    const date = new Date(Math.round((cell - 25569) * 86_400_000))
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
  }
  const s = String(cell).trim()
  if (!s) return ''
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3]
    const month = Number(m[2])
    const day = Number(m[1])
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    return `${year}-${pad(month)}-${pad(day)}`
  }
  return null
}

/** Retorna `undefined` para células vazias e `null` para valores inválidos. */
export function parsePercentCell(cell: Cell): number | null | undefined {
  if (cell === null || cell === undefined || cell === '') return undefined
  let n: number
  if (typeof cell === 'number') {
    n = cell > 0 && cell <= 1 ? cell * 100 : cell
  } else {
    const s = String(cell).trim().replace('%', '').replace(',', '.')
    if (!s) return undefined
    n = Number(s)
  }
  if (!Number.isFinite(n) || n < 0 || n > 100) return null
  return Math.round(n)
}

export function parseStatusCell(cell: Cell): Status | null {
  const s = normalize(cellToString(cell))
  if (!s) return 'a_iniciar'
  if (s.startsWith('conclu') || s === 'ok' || s.startsWith('finaliz')) return 'concluido'
  if (s.startsWith('em and') || s.startsWith('andamento') || s.startsWith('execu')) return 'em_andamento'
  if (s.startsWith('a ini') || s.startsWith('nao ini') || s.startsWith('pendente') || s.startsWith('planej')) return 'a_iniciar'
  if (s.startsWith('atras')) return 'atrasado'
  return null
}

export interface RowIssue {
  line: number
  message: string
}

export interface ImportRow {
  strategic_perspective: string
  objetivo: string
  setor: string
  iniciativa: string
  gestor: string
  descricao: string
  valorTotal: string
  valor2026: string
  kr: string
  krSetor: string
  numero: number | null
  etapa: string
  previsto: number | null
  realizado: number | null
  responsavel: string
  status: Status
  dataInicio: string
  dataTermino: string
}

export interface BuildResult {
  valid: ImportRow[]
  issues: RowIssue[]
}

export function buildRows(dataRows: Grid, mapping: Mapping): BuildResult {
  const valid: ImportRow[] = []
  const issues: RowIssue[] = []

  const get = (row: Grid[number], key: FieldKey): Cell => {
    const idx = mapping[key]
    return idx === undefined ? undefined : row[idx]
  }
  const text = (row: Grid[number], key: FieldKey) => cellToString(get(row, key))
  const labelOf = (key: FieldKey) => FIELD_DEFS.find((d) => d.key === key)?.label ?? key

  dataRows.forEach((row, i) => {
    const line = i + 2
    if (row.every((c) => cellToString(c) === '')) return
    const problems: string[] = []

    for (const def of FIELD_DEFS) {
      if (def.required && !text(row, def.key)) problems.push(`"${def.label}" vazio`)
    }

    const dates = { dataInicio: '', dataTermino: '' }
    for (const key of Object.keys(dates) as (keyof typeof dates)[]) {
      const parsed = parseDateCell(get(row, key))
      if (parsed === null) problems.push(`data inválida em "${labelOf(key)}"`)
      else dates[key] = parsed
    }
    if (dates.dataInicio && dates.dataTermino && dates.dataTermino < dates.dataInicio) {
      problems.push('término anterior ao início')
    }

    const percents = { previsto: null as number | null, realizado: null as number | null }
    for (const key of ['previsto', 'realizado'] as const) {
      const parsed = parsePercentCell(get(row, key))
      if (parsed === null) problems.push(`percentual inválido em "${labelOf(key)}"`)
      else percents[key] = parsed ?? null
    }

    const numeroRaw = text(row, 'numero')
    const numero = numeroRaw ? Math.floor(Number(numeroRaw.replace(',', '.'))) : null
    if (numeroRaw && (numero === null || !Number.isFinite(numero) || numero < 1)) problems.push('Nº da etapa inválido')

    const status = parseStatusCell(get(row, 'status'))
    if (status === null) problems.push('status não reconhecido')

    if (problems.length > 0 || status === null) {
      issues.push({ line, message: problems.join('; ') })
      return
    }

    const responsavel = text(row, 'responsavel')
    const setor = text(row, 'setor') || responsavel
    valid.push({
      strategic_perspective: text(row, 'strategic_perspective'),
      objetivo: text(row, 'objetivo'),
      setor,
      iniciativa: text(row, 'iniciativa'),
      gestor: text(row, 'gestor'),
      descricao: text(row, 'descricao'),
      valorTotal: text(row, 'valorTotal') || 'A definir',
      valor2026: text(row, 'valor2026') || 'A definir',
      kr: text(row, 'kr'),
      krSetor: text(row, 'krSetor') || setor,
      numero,
      etapa: text(row, 'etapa'),
      previsto: percents.previsto,
      realizado: percents.realizado,
      responsavel,
      status,
      ...dates,
    })
  })

  return { valid, issues }
}

const DEFAULT_PROGRESS: Record<Status, number> = { concluido: 100, em_andamento: 50, a_iniciar: 0, atrasado: 30 }

export interface ImportSummary {
  iniciativas: number
  krs: number
  etapas: number
}

export function mergeImport(current: PlanData, rows: ImportRow[], mode: 'append' | 'replace', author: string) {
  const data: PlanData =
    mode === 'replace'
      ? { iniciativas: [], krs: [], etapas: [], justificativas: [] }
      : {
        iniciativas: [...current.iniciativas],
        krs: [...current.krs],
        etapas: [...current.etapas],
        justificativas: [...current.justificativas],
      }
  const summary: ImportSummary = { iniciativas: 0, krs: 0, etapas: 0 }

  for (const r of rows) {
    let ini: Iniciativa | undefined = data.iniciativas.find((x) => normalize(x.nome) === normalize(r.iniciativa))
    if (!ini) {
      ini = {
        id: uid('ini'),
        strategic_perspective: r.strategic_perspective,
        objetivo: r.objetivo,
        setor: r.setor,
        nome: r.iniciativa,
        gestor: r.gestor,
        descricao: r.descricao,
        valorTotal: r.valorTotal,
        valor2026: r.valor2026,
      }
      data.iniciativas.push(ini)
      summary.iniciativas++
    }
    const iniId = ini.id

    let kr: KR | undefined = data.krs.find((x) => x.iniciativaId === iniId && normalize(x.nome) === normalize(r.kr))
    if (!kr) {
      kr = { id: uid('kr'), iniciativaId: iniId, nome: r.kr, setor: r.krSetor }
      data.krs.push(kr)
      summary.krs++
    }
    const krId = kr.id

    const numero = r.numero ?? data.etapas.filter((e) => e.krId === krId).length + 1
    const realizado = r.realizado ?? DEFAULT_PROGRESS[r.status]
    const etapa: Etapa = {
      id: uid('etp'),
      krId,
      numero,
      nome: r.etapa,
      previsto: r.previsto ?? (r.status === 'concluido' ? 100 : expectedProgress(r.dataInicio, r.dataTermino)),
      realizado: r.status === 'concluido' ? 100 : realizado,
      responsavel: r.responsavel,
      status: r.status,
      dataInicio: r.dataInicio,
      dataTermino: r.dataTermino,
      log: [{ id: uid('log'), date: REFERENCE_DATE, author, type: 'sistema', text: 'Etapa importada via Carga de Planilhas.' }],
    }
    data.etapas.push(etapa)
    summary.etapas++
  }

  return { data, summary }
}

export function parseCsv(text: string): Grid {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') inQuotes = false
      else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export const SAMPLE_FILE_NAME = 'planejamento-estrategico-2026.xlsx'

const TI = ['Pessoas e Recursos', 'Fortalecer a estrutura da ARPE e fomentar a inovação', 'CTI / DAF', 'Modernização da Infraestrutura de TI', 'Luiz de Freitas', 'Renovação de equipamentos, otimização do servidor de rede e rotina de testes de restauração de backup.', 'A definir', 'A definir']
const SAN = ['Sociedade', 'Ampliar a cobertura e a qualidade dos serviços regulados', 'SRHS', 'Fiscalização de Esgotamento Sanitário', 'Juliana Barros', 'Fiscalização das ETEs priorizadas na RMR.', '250000', '120000']

export const SAMPLE_GRID: Grid = [
  ['StrategicPerspective Estratégica', 'objetivo Estratégico', 'Setor Responsável', 'Nome da Iniciativa', 'Gestor Responsável', 'Descrição Resumida', 'Valor Estimado Total', 'Valor Estimado 2026', 'KR', 'Setor do KR', 'Nº', 'Nome da Etapa', 'Previsto', 'Realizado', 'Responsável pela Etapa', 'Status', 'Data Início', 'Data Término'],
  [...TI, 'Substituir 100% dos computadores com vida útil excedida', 'CTI', 1, 'Levantamento do parque de equipamentos', 100, 100, 'CTI', 'Concluído', '02/02/2026', '13/03/2026'],
  [...TI, 'Substituir 100% dos computadores com vida útil excedida', 'CTI', 2, 'Processo de aquisição dos computadores', 100, 60, 'DAF', 'Atrasado', '01/06/2026', '30/09/2026'],
  [...TI, 'Substituir 100% dos computadores com vida útil excedida', 'CTI', 3, 'Instalação e configuração dos equipamentos', 0, 0, 'CTI', 'A Iniciar', '02/11/2026', '18/12/2026'],
  [...TI, 'Realizar testes de restauração de backup trimestrais', 'CTI / DAF', 1, 'Formalização da rotina de testes', 60, 40, 'DAF', 'Em Andamento', '01/09/2026', '27/11/2026'],
  [...TI, 'Realizar testes de restauração de backup trimestrais', 'CTI / DAF', 2, 'Primeiro ciclo de testes de restauração', 10, 15, 'CTI', 'Em Andamento', '05/10/2026', '11/12/2026'],
  [...SAN, 'Vistoriar 100% das ETEs priorizadas', 'ARPE', 1, 'Seleção das ETEs prioritárias', 100, 100, 'ARPE', 'Concluído', '02/03/2026', '30/04/2026'],
  [...SAN, 'Vistoriar 100% das ETEs priorizadas', 'ARPE', 2, 'Vistorias em campo', 45, 30, 'COMPESA', 'Em Andamento', '04/05/2026', '27/11/2026'],
  [...SAN, 'Emitir relatórios técnicos de conformidade', 'SRHS', 1, 'Consolidação dos relatórios de vistoria', 0, 0, 'SRHS', 'A Iniciar', '30/11/2026', '28/02/2027'],
]
