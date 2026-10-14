import { describe, it, expect } from 'vitest'
import { toSupabase, fromSupabase, isIsbnDuplicadoErro } from '@/lib/mapper.js'

describe('mapper livro <-> supabase', () => {
  it('toSupabase envia só colunas do banco', () => {
    const out = toSupabase({
      id: 'abc',
      titulo: 'Dom Casmurro',
      autor: 'Machado',
      editora: 'Garnier',
      isbn: '9788535902778',
      ano: '1899',
      paginas: '256',
      capa: 'https://x/capa.jpg',
      descricao: 'Clássico',
      exemplares: 3,
      estadoLivro: 'usado',
      metodoAquisicao: 'doacao',
      exemplaresLista: [{ id: '1', tombo: 'BIB-000001' }]
    })
    expect(out).toEqual({
      id: 'abc',
      titulo: 'Dom Casmurro',
      autor: 'Machado',
      editora: 'Garnier',
      isbn: '9788535902778',
      ano: '1899',
      paginas: '256',
      capa: 'https://x/capa.jpg',
      descricao: 'Clássico',
      exemplares: 3
    })
    expect(out).not.toHaveProperty('estadoLivro')
    expect(out).not.toHaveProperty('exemplaresLista')
  })

  it('fromSupabase preenche defaults do Vue', () => {
    const vue = fromSupabase({
      id: 'abc',
      titulo: 'Dom Casmurro',
      autor: null,
      editora: null,
      isbn: '9788535902778',
      ano: null,
      paginas: null,
      capa: null,
      descricao: null,
      exemplares: 1,
      criado_em: '2026-10-09T00:00:00Z',
      atualizado_em: '2026-10-09T00:00:00Z'
    })
    expect(vue.autor).toBe('')
    expect(vue.exemplaresLista).toEqual([])
    expect(vue.criadoEm).toBe('2026-10-09T00:00:00Z')
  })

  it('detecta erro de ISBN duplicado', () => {
    expect(isIsbnDuplicadoErro({ code: '23505' })).toBe(true)
    expect(isIsbnDuplicadoErro({ message: 'duplicate isbn' })).toBe(true)
    expect(isIsbnDuplicadoErro({ message: 'outro' })).toBe(false)
  })
})
