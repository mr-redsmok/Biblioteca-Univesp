import { describe, it, expect } from 'vitest'
import { Buffer } from 'node:buffer'
import { parseSedCsv } from '@/lib/sedCsv.js'

function csvBuffer(texto) {
  const bytes = Buffer.from(texto, 'latin1')
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

const CABECALHO = 'Nº de chamada;Nome do Aluno;RA;Dig. RA;Data de Nascimento;Email Microsoft;Email Google;Situação do Aluno'

describe('parseSedCsv', () => {
  it('lê o CSV do SED, preserva acentos, apóstrofo, zeros e dígito X', () => {
    const csv = [
      'Alunos;19/10/2026 21:25',
      '',
      'Filtros',
      '',
      'Ano Letivo;2026',
      '',
      CABECALHO,
      "1;José D'Ávila Conceição;000012345;X;01/02/2010;jose@example.com;jose@gmail.com;Ativo",
      '2;Ana   Clara;000123;0;03/04/2011;ana@example.com;ana@gmail.com;Ativo',
      '3;Sem RA;;0;05/06/2012;sem@example.com;sem@gmail.com;Ativo',
      '',
      '4;;000999;1;07/08/2013;x@example.com;x@gmail.com;Ativo',
      ''
    ].join('\r\n')

    const resultado = parseSedCsv(csvBuffer(csv))

    expect(resultado.anoLetivo).toBe(2026)
    expect(resultado.alunos).toHaveLength(2)
    expect(resultado.alunos[0]).toEqual({
      nome: "José D'Ávila Conceição",
      ra: '000012345',
      digRa: 'X',
      situacao: 'Ativo'
    })
    expect(resultado.alunos[1]).toEqual({
      nome: 'Ana Clara',
      ra: '000123',
      digRa: '0',
      situacao: 'Ativo'
    })
    expect(resultado.erros.map(e => e.linha)).toEqual([10, 12])
    expect(resultado.erros.map(e => e.motivo)).toEqual(['Linha sem RA', 'Linha sem nome'])
  })

  it('não expõe e-mail nem data de nascimento no resultado', () => {
    const csv = [
      'Ano Letivo;2026',
      CABECALHO,
      "1;Maria D'Ávila;000777;0;01/02/2010;maria@example.com;maria@gmail.com;Ativo"
    ].join('\r\n')

    const resultado = parseSedCsv(csvBuffer(csv))
    const serializado = JSON.stringify(resultado)

    expect(Object.keys(resultado.alunos[0])).toEqual(['nome', 'ra', 'digRa', 'situacao'])
    expect(serializado).not.toContain('@')
    expect(serializado).not.toContain('01/02/2010')
    expect(serializado).not.toContain('Data de Nascimento')
  })

  it('localiza o cabeçalho fora de posição fixa e aceita colunas reordenadas', () => {
    const csv = [
      'Alunos;19/10/2026 21:25',
      '',
      'Filtros',
      '',
      'Ano Letivo;2027',
      '',
      'Nome do Aluno;Situação do Aluno;Dig. RA;RA;Email Google',
      "Maria D'Ávila;Ativo;0;000777;maria@example.com"
    ].join('\r\n')

    const resultado = parseSedCsv(csvBuffer(csv))

    expect(resultado.anoLetivo).toBe(2027)
    expect(resultado.alunos).toEqual([{
      nome: "Maria D'Ávila",
      ra: '000777',
      digRa: '0',
      situacao: 'Ativo'
    }])
    expect(resultado.erros).toEqual([])
  })

  it('aceita campo entre aspas com ponto e vírgula', () => {
    const csv = [
      'Ano Letivo;2026',
      CABECALHO,
      '1;"Silva; João";000888;0;01/02/2010;;;Ativo'
    ].join('\r\n')

    const resultado = parseSedCsv(csvBuffer(csv))

    expect(resultado.alunos[0].nome).toBe('Silva; João')
  })

  it('devolve erro quando o cabeçalho não é encontrado', () => {
    const csv = [
      'Alunos;19/10/2026 21:25',
      '',
      'Filtros',
      '',
      'Ano Letivo;2026'
    ].join('\r\n')

    const resultado = parseSedCsv(csvBuffer(csv))

    expect(resultado.anoLetivo).toBe(2026)
    expect(resultado.alunos).toEqual([])
    expect(resultado.erros).toHaveLength(1)
    expect(resultado.erros[0].motivo).toContain('Cabeçalho')
  })
})
