import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/lib/supabase.js', () => ({
  isSupabaseConfigured: () => false,
  supabase: null
}))

import { useAlunosStore } from '@/stores/alunos.js'
import { planejarImportacao } from '@/lib/importAlunos.js'

function aluno(ra, digRa, nome, situacao = 'Ativo') {
  return { nome, ra, digRa, situacao }
}

describe('aplicarImportacao (modo local)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('grava, inativa e não duplica ao reimportar', async () => {
    const store = useAlunosStore()
    const lote = {
      turma: '6º A',
      anoLetivo: 2026,
      arquivo: 'ficticio.csv',
      alunos: [
        aluno('000000001', '0', 'Ana'),
        aluno('000000002', 'X', 'Bruno'),
        aluno('000000003', '0', 'Carla', 'Transferido')
      ]
    }

    const plano = planejarImportacao(store.alunos, [lote])
    const resultado = await store.aplicarImportacao(plano)

    expect(resultado.gravados).toBe(3)
    expect(store.alunos).toHaveLength(3)
    expect(store.alunos.filter(a => !a.ativo)).toHaveLength(1)
    expect(store.alunos.find(a => a.matricula === '000000003-0').ativo).toBe(false)

    const ana = store.alunos.find(a => a.matricula === '000000001-0')
    ana.telefone = '14999998888'
    const criadoEm = ana.criadoEm

    const reimportado = planejarImportacao(store.alunos, [lote])
    expect(reimportado.novos).toHaveLength(0)
    await store.aplicarImportacao(reimportado)

    expect(store.alunos).toHaveLength(3)
    expect(store.alunos.find(a => a.matricula === '000000001-0').telefone).toBe('14999998888')
    expect(store.alunos.find(a => a.matricula === '000000001-0').criadoEm).toBe(criadoEm)
  })

  it('inativa somente as possíveis saídas marcadas', async () => {
    const store = useAlunosStore()
    const lote2026 = {
      turma: '6º A',
      anoLetivo: 2026,
      alunos: [
        aluno('000000001', '0', 'Ana'),
        aluno('000000002', '0', 'Bruno')
      ]
    }
    await store.aplicarImportacao(planejarImportacao(store.alunos, [lote2026]))

    const lote2027 = {
      turma: '6º A',
      anoLetivo: 2027,
      alunos: [aluno('000000001', '0', 'Ana')]
    }
    const plano = planejarImportacao(store.alunos, [lote2027])
    expect(plano.possiveisSaidas.map(a => a.matricula)).toEqual(['000000002-0'])

    await store.aplicarImportacao(plano, { inativar: ['000000002-0'] })

    expect(store.alunos).toHaveLength(2)
    expect(store.alunos.find(a => a.matricula === '000000002-0').ativo).toBe(false)
  })
})
