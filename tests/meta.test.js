import { describe, it, expect } from 'vitest'
import { metaBits, metaBusca } from '@/lib/meta.js'

describe('metaBits', () => {
  it('retorna vazio para nulo', () => {
    expect(metaBits(null)).toEqual([])
  })

  it('monta editora, ano, págs, isbn, tombo e rótulos', () => {
    const bits = metaBits({
      editora: 'Garnier',
      ano: '1899',
      paginas: '256',
      isbn: '9788535902778',
      exemplaresLista: [{ tombo: 'BIB-000001' }],
      estadoLivro: 'usado',
      metodoAquisicao: 'doacao'
    })
    expect(bits).toContain('Garnier')
    expect(bits).toContain('256 págs')
    expect(bits.join(' ')).toMatch(/Tombo: BIB-000001/)
    expect(bits).toContain('Usado')
    expect(bits).toContain('Doação')
  })
})

describe('metaBusca', () => {
  it('formata ano numérico como string', () => {
    expect(metaBusca({ editora: 'E', ano: 2001, paginas: '10', isbn: 'X' }))
      .toEqual(['E', '2001', '10 págs', 'ISBN X'])
  })
})
