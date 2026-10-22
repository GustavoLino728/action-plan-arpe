import { expectedProgress } from './plan-utils'
import type { Etapa, Justificativa, LogEntry, PlanData, Status } from './types'

type JustSeed = [
  dataRegistro: string,
  acaoCorretiva: string,
  responsavel: string,
  previsaoSolucao: string,
  sobGovernanca: boolean,
  resolvido: boolean,
]

type EtapaSeed = [
  nome: string,
  realizado: number,
  responsavel: string,
  status: Status,
  dataInicio: string,
  dataTermino: string,
  justificativas?: JustSeed[],
]

interface KrSeed {
  nome: string
  setor: string
  etapas: EtapaSeed[]
}

interface IniciativaSeed {
  strategic_perspective: string
  objetivo: string
  setor: string
  nome: string
  gestor: string
  descricao: string
  valorTotal: string
  valor2026: string
  krs: KrSeed[]
}

const AUTHORS: Record<string, string> = {
  CTI: 'Marcelo Albuquerque',
  ARPE: 'Renata Vasconcelos',
  COMPESA: 'Fábio Cavalcanti',
  SRHS: 'Juliana Barros',
  OUVIDORIA: 'Patrícia Moura',
  DAF: 'Eduardo Lins',
  GRH: 'Camila Freitas',
  SEFAZ: 'Roberto Siqueira',
}

const PLAN: IniciativaSeed[] = [
  {
    strategic_perspective: 'Pessoas e Recursos',
    objetivo: 'Fortalecer a estrutura da ARPE e fomentar a inovação',
    setor: 'CTI (Coordenadoria de Tecnologia da Informação) / DAF',
    nome: 'Modernização da Infraestrutura de TI',
    gestor: 'Luiz de Freitas',
    descricao:
      'Iniciativa voltada à renovação de equipamentos com vida útil excedida, à otimização do uso de recursos do servidor de rede, à avaliação da virtualização do ambiente de backup e à formalização de rotina de testes de restauração, garantindo maior disponibilidade, segurança e eficiência da infraestrutura de TI da Arpe.',
    valorTotal: 'A definir',
    valor2026: 'A definir',
    krs: [
      {
        nome: 'Renovar os equipamentos com vida útil excedida',
        setor: 'CTI',
        etapas: [
          ['Levantamento do parque de equipamentos com vida útil excedida', 100, 'CTI', 'concluido', '2026-02-02', '2026-03-13'],
          ['Elaboração do termo de referência para aquisição', 100, 'CTI', 'concluido', '2026-03-16', '2026-05-29'],
          [
            'Processo licitatório de aquisição dos equipamentos',
            70,
            'DAF',
            'atrasado',
            '2026-06-01',
            '2026-09-30',
            [['2026-10-02', 'Reabrir a pesquisa de preços com novos fornecedores e solicitar prioridade à Comissão de Licitação.', 'DAF', '2026-11-13', true, false]],
          ],
          ['Instalação e configuração dos novos equipamentos', 0, 'CTI', 'a_iniciar', '2026-11-02', '2026-12-18'],
        ],
      },
      {
        nome: 'Otimizar o uso de recursos do servidor de rede',
        setor: 'CTI',
        etapas: [
          ['Diagnóstico de consumo de CPU, memória e armazenamento', 100, 'CTI', 'concluido', '2026-03-02', '2026-04-17'],
          ['Reorganização de volumes e limpeza de dados obsoletos', 60, 'CTI', 'em_andamento', '2026-08-03', '2026-11-27'],
          ['Definição de cotas de armazenamento por setor', 30, 'CTI', 'atrasado', '2026-09-01', '2026-10-09'],
        ],
      },
      {
        nome: 'Formalizar a rotina de testes de restauração de backup',
        setor: 'CTI / DAF',
        etapas: [
          ['Avaliação da virtualização do ambiente de backup', 100, 'CTI', 'concluido', '2026-05-04', '2026-07-31'],
          [
            'Formalização da rotina de testes de restauração (norma interna)',
            40,
            'DAF',
            'atrasado',
            '2026-07-01',
            '2026-10-02',
            [['2026-10-05', 'Aguardar parecer da Procuradoria sobre a minuta da norma interna.', 'DAF', '2026-11-20', false, false]],
          ],
          ['Execução do primeiro ciclo de testes de restauração', 15, 'CTI', 'em_andamento', '2026-10-05', '2026-12-11'],
          ['Relatório semestral de testes de restauração', 0, 'CTI', 'a_iniciar', '2026-12-14', '2027-01-29'],
        ],
      },
    ],
  },
  {
    strategic_perspective: 'Sociedade',
    objetivo: 'Ampliar a cobertura e a qualidade dos serviços de saneamento regulados',
    setor: 'SRHS',
    nome: 'Programa de Fiscalização do Esgotamento Sanitário',
    gestor: 'Juliana Barros',
    descricao: 'Fiscalização in loco das estações de tratamento e acompanhamento dos planos de adequação dos prestadores na Região Metropolitana do Recife.',
    valorTotal: '480000',
    valor2026: '320000',
    krs: [
      {
        nome: 'Fiscalizar os 21 municípios da RMR até dezembro de 2026',
        setor: 'ARPE',
        etapas: [
          ['Levantamento de ETEs e estações elevatórias em operação', 100, 'COMPESA', 'concluido', '2026-01-12', '2026-03-31'],
          ['Plano anual de fiscalização in loco', 100, 'ARPE', 'concluido', '2026-02-02', '2026-04-30'],
          ['Execução das fiscalizações nos municípios da RMR', 68, 'ARPE', 'em_andamento', '2026-05-04', '2026-11-27'],
        ],
      },
      {
        nome: 'Regularizar os planos de adequação dos prestadores',
        setor: 'COMPESA',
        etapas: [
          ['Notificação dos prestadores com não conformidade', 100, 'ARPE', 'concluido', '2026-06-01', '2026-07-17'],
          [
            'Acompanhamento dos planos de adequação',
            40,
            'COMPESA',
            'atrasado',
            '2026-07-01',
            '2026-10-02',
            [['2026-10-06', 'Solicitar prorrogação formal e instaurar processo de apuração.', 'ARPE', '2026-11-30', true, false]],
          ],
        ],
      },
    ],
  },
  {
    strategic_perspective: 'Sociedade',
    objetivo: 'Fortalecer a transparência e o atendimento ao usuário',
    setor: 'OUVIDORIA',
    nome: 'Modernização da Ouvidoria e dos Canais de Atendimento',
    gestor: 'Patrícia Moura',
    descricao: 'Digitalização do fluxo de manifestações e redução do prazo médio de resposta ao cidadão.',
    valorTotal: '150000',
    valor2026: '90000',
    krs: [
      {
        nome: 'Reduzir para 10 dias o prazo médio de resposta',
        setor: 'OUVIDORIA',
        etapas: [
          ['Mapeamento do fluxo de manifestações', 100, 'OUVIDORIA', 'concluido', '2026-02-02', '2026-04-03'],
          ['Implantação do sistema de protocolo digital', 55, 'CTI', 'em_andamento', '2026-05-04', '2026-12-04'],
          ['Capacitação dos atendentes', 0, 'GRH', 'a_iniciar', '2026-11-09', '2026-12-18'],
        ],
      },
    ],
  },
  {
    strategic_perspective: 'Processos Internos',
    objetivo: 'Aprimorar a regulação e a fiscalização econômica',
    setor: 'ARPE',
    nome: 'Revisão Tarifária Periódica do Saneamento',
    gestor: 'Renata Vasconcelos',
    descricao: 'Condução da revisão tarifária periódica, da consulta pública à publicação da resolução homologada pelo Conselho Diretor.',
    valorTotal: 'A definir',
    valor2026: '210000',
    krs: [
      {
        nome: 'Concluir a revisão tarifária com homologação em 2026',
        setor: 'ARPE',
        etapas: [
          ['Consulta pública da metodologia tarifária', 100, 'ARPE', 'concluido', '2026-02-09', '2026-05-08'],
          ['Análise da base de ativos regulatória', 100, 'ARPE', 'concluido', '2026-05-11', '2026-09-04'],
          ['Audiência pública da proposta tarifária', 45, 'ARPE', 'em_andamento', '2026-10-05', '2026-11-06'],
          ['Publicação da resolução tarifária', 0, 'SRHS', 'a_iniciar', '2026-11-09', '2026-12-15'],
        ],
      },
    ],
  },
  {
    strategic_perspective: 'Pessoas e Recursos',
    objetivo: 'Desenvolver competências técnicas e cultura de resultados',
    setor: 'GRH',
    nome: 'Plano de Capacitação Técnica ARPE 2026',
    gestor: 'Camila Freitas',
    descricao: 'Trilhas de capacitação em regulação, fiscalização de campo e gestão por competências para o corpo técnico.',
    valorTotal: '260000',
    valor2026: '180000',
    krs: [
      {
        nome: 'Capacitar 90% dos servidores nas trilhas prioritárias',
        setor: 'GRH',
        etapas: [
          ['Levantamento de necessidades de capacitação (LNC)', 100, 'GRH', 'concluido', '2026-01-12', '2026-02-27'],
          ['Cursos de regulação econômica e tarifária', 100, 'GRH', 'concluido', '2026-03-09', '2026-08-28'],
          ['Programa de formação em fiscalização de campo', 65, 'GRH', 'em_andamento', '2026-06-01', '2026-11-27'],
        ],
      },
      {
        nome: 'Elevar a satisfação no clima organizacional para 80%',
        setor: 'GRH',
        etapas: [
          ['Pesquisa de clima organizacional', 100, 'GRH', 'concluido', '2026-04-06', '2026-06-05'],
          [
            'Mapeamento de competências por cargo',
            50,
            'GRH',
            'atrasado',
            '2026-07-06',
            '2026-10-02',
            [['2026-10-08', 'Alinhar com a SEFAZ a revisão das descrições de cargos.', 'GRH', '2026-11-27', false, false]],
          ],
        ],
      },
    ],
  },
  {
    strategic_perspective: 'Pessoas e Recursos',
    objetivo: 'Garantir a sustentabilidade financeira e a eficiência orçamentária',
    setor: 'DAF',
    nome: 'Taxa de Regulação e Fiscalização — Arrecadação',
    gestor: 'Eduardo Lins',
    descricao: 'Revisão da base de cálculo e recuperação de crédito da taxa de regulação e fiscalização dos prestadores.',
    valorTotal: 'A definir',
    valor2026: 'A definir',
    krs: [
      {
        nome: 'Recuperar 90% do crédito inadimplente',
        setor: 'DAF',
        etapas: [
          ['Revisão da base de cálculo da taxa', 100, 'SEFAZ', 'concluido', '2026-03-02', '2026-07-31'],
          ['Cobrança ativa dos prestadores inadimplentes', 70, 'DAF', 'atrasado', '2026-08-03', '2026-10-09'],
          ['Painel de arrecadação mensal', 0, 'CTI', 'a_iniciar', '2026-11-02', '2026-12-04'],
        ],
      },
    ],
  },
]

function buildLog(id: string, seed: EtapaSeed): LogEntry[] {
  const [nome, realizado, responsavel, status, dataInicio, dataTermino] = seed
  const author = AUTHORS[responsavel] ?? responsavel
  const log: LogEntry[] = []
  if (status !== 'a_iniciar') {
    log.push({ id: `${id}-l1`, date: dataInicio, author, type: 'status', text: 'Etapa iniciada. Status alterado para Em Andamento.' })
  }
  if (status === 'em_andamento' && realizado > 0) {
    log.push({ id: `${id}-l2`, date: '2026-10-09', author, type: 'comentario', text: `Atualização de progresso: ${realizado}% executado.` })
  }
  if (status === 'atrasado') {
    log.push({ id: `${id}-l3`, date: dataTermino, author: 'Sistema', type: 'sistema', text: 'Prazo vencido sem conclusão. Etapa sinalizada como Atrasada.' })
  }
  if (status === 'concluido') {
    log.push({ id: `${id}-l5`, date: dataTermino, author, type: 'status', text: `Etapa "${nome}" concluída.` })
  }
  return log.sort((a, b) => b.date.localeCompare(a.date))
}

export function buildInitialData(): PlanData {
  const data: PlanData = { iniciativas: [], krs: [], etapas: [], justificativas: [] }
  PLAN.forEach((ini, i) => {
    const iniciativaId = `ini-${String(i + 1).padStart(2, '0')}`
    data.iniciativas.push({
      id: iniciativaId,
      strategic_perspective: ini.strategic_perspective,
      objetivo: ini.objetivo,
      setor: ini.setor,
      nome: ini.nome,
      gestor: ini.gestor,
      descricao: ini.descricao,
      valorTotal: ini.valorTotal,
      valor2026: ini.valor2026,
    })
    ini.krs.forEach((kr, k) => {
      const krId = `${iniciativaId}-kr${k + 1}`
      data.krs.push({ id: krId, iniciativaId, nome: kr.nome, setor: kr.setor })
      kr.etapas.forEach((seed, e) => {
        const [nome, realizado, responsavel, status, dataInicio, dataTermino, justs] = seed
        const id = `${krId}-e${e + 1}`
        const etapa: Etapa = {
          id,
          krId,
          numero: e + 1,
          nome,
          previsto: status === 'concluido' ? 100 : expectedProgress(dataInicio, dataTermino),
          realizado,
          responsavel,
          status,
          dataInicio,
          dataTermino,
          log: buildLog(id, seed),
        }
        data.etapas.push(etapa)
        justs?.forEach((j, n) => {
          const just: Justificativa = {
            id: `${id}-j${n + 1}`,
            etapaId: id,
            dataRegistro: j[0],
            acaoCorretiva: j[1],
            responsavel: j[2],
            previsaoSolucao: j[3],
            sobGovernanca: j[4],
            resolvido: j[5],
          }
          data.justificativas.push(just)
        })
      })
    })
  })
  return data
}
