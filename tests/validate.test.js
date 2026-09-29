import { describe, it, expect } from 'vitest'
import { validarLivro, sanitizar, isbnDuplicado } from '@/lib/validate.js'

const base = {
  titulo: 'Dom Casmurro',
  autor: 'Machado de Assis',
  editora: 'Garnier',
  isbn: '9788535902778',
  ano: '1899',
  paginas: '256',
  exemplares: 1,
  capa: 'https://exemplo.com/capa.jpg',
  descricao: 'Clássico',
  estadoLivro: 'usado',
  metodoAquisicao: 'doacao'
}

describe('validarLivro', () => {
  it('aceita livro válido', () => {
    expect(validarLivro(base).ok).toBe(true)
  })

  it('exige título', () => {
    const r = validarLivro({ ...base, titulo: '  ' })
    expect(r.ok).toBe(false)
    expect(r.erros.join(' ')).toMatch(/título/i)
  })

  it('rejeita ano e páginas inválidos', () => {
    expect(validarLivro({ ...base, ano: 'abcd' }).ok).toBe(false)
    expect(validarLivro({ ...base, paginas: '0' }).ok).toBe(false)
    expect(validarLivro({ ...base, exemplares: -1 }).ok).toBe(false)
  })

  it('exemplares 0 cai para padrão 1 (comportamento atual)', () => {
    expect(validarLivro({ ...base, exemplares: 0 }).ok).toBe(true)
  })

  it('rejeita ISBN curto e capa sem http', () => {
    expect(validarLivro({ ...base, isbn: '123' }).ok).toBe(false)
    expect(validarLivro({ ...base, capa: 'ftp://x' }).ok).toBe(false)
  })

  it('exige estado e aquisição válidos', () => {
    expect(validarLivro({ ...base, estadoLivro: '' }).ok).toBe(false)
    expect(validarLivro({ ...base, estadoLivro: 'velho' }).ok).toBe(false)
    expect(validarLivro({ ...base, metodoAquisicao: 'roubo' }).ok).toBe(false)
  })
})

describe('sanitizar', () => {
  it('normaliza isbn e gera id', () => {
    const l = sanitizar({ ...base, isbn: '978-85-359-0277-8' })
    expect(l.isbn).toBe('9788535902778')
    expect(l.id).toBeTruthy()
    expect(l.ano).toBe('1899')
  })
})

describe('isbnDuplicado', () => {
  const livros = [{ id: 'a', isbn: '9788535902778' }]
  it('detecta duplicado ignorando o próprio id', () => {
    expect(isbnDuplicado('9788535902778', livros)).toBe(true)
    expect(isbnDuplicado('9788535902778', livros, 'a')).toBe(false)
    expect(isbnDuplicado('', livros)).toBe(false)
  })
})
