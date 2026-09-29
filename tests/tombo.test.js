import { describe, it, expect, beforeEach } from 'vitest'
import { gerarTombo, peekProximoTombo, peekUm, setConfig, resetSeq, getConfigAtual } from '@/lib/tombo.js'

beforeEach(() => {
  localStorage.clear()
  setConfig({ prefixo: 'BIB', separador: '-', tamanho: 6 })
  resetSeq(0)
})

describe('tombo', () => {
  it('gera sequência incremental formatada', () => {
    expect(gerarTombo()).toBe('BIB-000001')
    expect(gerarTombo()).toBe('BIB-000002')
  })

  it('peek não consome sequência', () => {
    expect(peekUm()).toBe('BIB-000001')
    expect(peekProximoTombo(3)).toEqual(['BIB-000001', 'BIB-000002', 'BIB-000003'])
    expect(gerarTombo()).toBe('BIB-000001')
  })

  it('respeita config custom', () => {
    setConfig({ prefixo: 'EMEF', separador: '/', tamanho: 4 })
    expect(getConfigAtual().prefixo).toBe('EMEF')
    expect(gerarTombo()).toBe('EMEF/0001')
  })
})
