import { describe, it, expect } from 'vitest'
import { planejarImportacao } from '@/lib/importAlunos.js'

function alunoSED(ra, digRa, nome, situacao = 'Ativo') {
  return { nome, ra, digRa, situacao }
}

function montarAlunos2026() {
  return Array.from({ length: 50 }, (_, i) => {
    const n = i + 1
    const ra = String(n).padStart(9, '0')
    const digRa = n === 1 ? 'X' : '0'
    let nome = `Aluno ${String(n).padStart(2, '0')}`
    if (n === 1) nome = "José D'Ávila"
    if (n === 2) nome = 'Ana Clara'
    if (n === 3) nome = 'Conceição'

    let situacao = 'Ativo'
    if (n === 48 || n === 49) situacao = 'Transferido'
    if (n === 50) situacao = 'Baixa'

    return alunoSED(ra, digRa, nome, situacao)
  })
}

function existentesAPartirDe(plano) {
  const inativas = new Set(plano.inativarAgora.map(a => a.matricula))
  return plano.novos.map((a, i) => ({
    ...a,
    id: `aluno-${i}`,
    telefone: '',
    ativo: !inativas.has(a.matricula)
  }))
}

describe('planejarImportacao', () => {
  const alunos2026 = montarAlunos2026()
  const lote2026 = { turma: '6º A', anoLetivo: 2026, arquivo: 'alunos_2026.csv', alunos: alunos2026 }
  const plano2026 = planejarImportacao([], [lote2026])

  it('importa 50 alunos em branco e inativa 3 situações não-Ativo', () => {
    expect(plano2026.novos).toHaveLength(50)
    expect(plano2026.inativarAgora).toHaveLength(3)
    expect(plano2026.inativarAgora.filter(a => a.situacao === 'Transferido')).toHaveLength(2)
    expect(plano2026.inativarAgora.filter(a => a.situacao === 'Baixa')).toHaveLength(1)
    expect(plano2026.possiveisSaidas).toHaveLength(0)
    expect(plano2026.erros).toHaveLength(0)

    const novas = new Set(plano2026.novos.map(a => a.matricula))
    expect(plano2026.inativarAgora.every(a => novas.has(a.matricula))).toBe(true)
  })

  it('depois de 2026, importa 2027 com 10 novos, 40 existentes, 1 nome alterado e 7 saídas', () => {
    const existentes2026 = existentesAPartirDe(plano2026)

    const mantidos = alunos2026.slice(0, 40).map(a => ({ ...a, situacao: 'Ativo' }))
    mantidos[0] = { ...mantidos[0], nome: "José D'Ávila Silva" }

    const novos2027 = Array.from({ length: 10 }, (_, i) => {
      const n = 51 + i
      return alunoSED(String(n).padStart(9, '0'), '0', `Novo ${i + 1}`, 'Ativo')
    })

    const plano2027 = planejarImportacao(existentes2026, [{
      turma: '6º A',
      anoLetivo: 2027,
      arquivo: 'alunos_2027.csv',
      alunos: [...mantidos, ...novos2027]
    }])

    expect(plano2027.novos).toHaveLength(10)
    expect(plano2027.atualizados.length + plano2027.semMudanca.length).toBe(40)

    const comNomeAlterado = plano2027.atualizados.filter(a =>
      a.mudancas.some(m => m.campo === 'nome')
    )
    expect(comNomeAlterado).toHaveLength(1)
    expect(comNomeAlterado[0].mudancas.find(m => m.campo === 'nome')).toMatchObject({
      de: "José D'Ávila",
      para: "José D'Ávila Silva"
    })

    expect(plano2027.possiveisSaidas).toHaveLength(7)
    expect(plano2027.possiveisSaidas.every(a => a.ativo !== false)).toBe(true)
    expect(plano2027.inativarAgora).toHaveLength(0)
    expect(plano2027.erros).toHaveLength(0)

    const inativas2026 = new Set(existentes2026.filter(a => !a.ativo).map(a => a.matricula))
    expect(plano2027.possiveisSaidas.some(a => inativas2026.has(a.matricula))).toBe(false)
  })

  it('reimportar o mesmo arquivo não cria novos nem duplica', () => {
    const existentes2026 = existentesAPartirDe(plano2026)
    const planoReimportado = planejarImportacao(existentes2026, [lote2026])

    expect(planoReimportado.novos).toHaveLength(0)
    expect(planoReimportado.atualizados).toHaveLength(0)
    expect(planoReimportado.semMudanca).toHaveLength(50)
    expect(planoReimportado.inativarAgora).toHaveLength(3)
  })

  it('a mesma matrícula em dois lotes gera erro e não é escolhida silenciosamente', () => {
    const aluno = alunoSED('000000001', '0', 'Duplicado')
    const plano = planejarImportacao([], [
      { turma: '6º A', anoLetivo: 2026, arquivo: 'a.csv', alunos: [aluno] },
      { turma: '6º B', anoLetivo: 2026, arquivo: 'b.csv', alunos: [{ ...aluno }] }
    ])

    expect(plano.erros.some(e => e.matricula === '000000001-0')).toBe(true)
    expect(plano.novos).toHaveLength(0)
  })

  it('incorpora erros do parser e avisa quando o ano do arquivo difere da tela', () => {
    const plano = planejarImportacao([], [{
      turma: '6º A',
      anoLetivo: 2026,
      anoLetivoArquivo: 2027,
      arquivo: 'a.csv',
      alunos: [alunoSED('000000002', '0', 'Aluno')],
      erros: [{ linha: 10, motivo: 'Linha sem RA' }]
    }], 2026)

    expect(plano.erros[0]).toMatchObject({
      linha: 10,
      motivo: 'Linha sem RA',
      arquivo: 'a.csv'
    })
    expect(plano.avisos).toHaveLength(1)
    expect(plano.avisos[0]).toMatchObject({
      anoLetivoArquivo: 2027,
      anoLetivoInformado: 2026
    })
  })

  it('não exclui ninguém: quem falta vira possível saída, não remoção', () => {
    const existentes2026 = existentesAPartirDe(plano2026)
    const copia = existentes2026.map(a => ({ ...a }))

    const plano = planejarImportacao(existentes2026, [{
      turma: '6º A',
      anoLetivo: 2026,
      arquivo: 'parcial.csv',
      alunos: alunos2026.slice(0, 1)
    }])

    expect(existentes2026).toHaveLength(copia.length)
    expect(plano.possiveisSaidas.length).toBeGreaterThan(0)
    expect(plano).not.toHaveProperty('excluidos')
    expect(plano).not.toHaveProperty('removidos')
  })
})
