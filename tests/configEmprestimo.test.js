import { beforeEach, describe, expect, it } from 'vitest'
import {
  getConfigEmprestimo,
  getDiasEmprestimoPadrao,
  setConfigEmprestimo,
  DIAS_EMPRESTIMO_PADRAO
} from '@/lib/configEmprestimo.js'

beforeEach(() => {
  localStorage.clear()
})

describe('configuração de empréstimo', () => {
  it('usa 14 dias quando não há configuração', () => {
    expect(getConfigEmprestimo()).toEqual({ dias: DIAS_EMPRESTIMO_PADRAO })
    expect(getDiasEmprestimoPadrao()).toBe(14)
  })

  it('salva e lê o prazo padrão', () => {
    setConfigEmprestimo({ dias: 21 })
    expect(getConfigEmprestimo()).toEqual({ dias: 21 })
    expect(getDiasEmprestimoPadrao()).toBe(21)
  })

  it('rejeita prazos fora do intervalo permitido', () => {
    expect(() => setConfigEmprestimo({ dias: 0 })).toThrow()
    expect(() => setConfigEmprestimo({ dias: 91 })).toThrow()
    expect(() => setConfigEmprestimo({ dias: 2.5 })).toThrow()
    expect(() => setConfigEmprestimo({ dias: 'abc' })).toThrow()
  })

  it('ignora configuração inválida salva no navegador', () => {
    localStorage.setItem('sgbl_emprestimo_config', JSON.stringify({ dias: 999 }))
    expect(getDiasEmprestimoPadrao()).toBe(DIAS_EMPRESTIMO_PADRAO)
  })
})
