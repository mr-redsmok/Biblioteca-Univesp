import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { newId, toast } from '@/lib/utils.js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase.js'
import { toAluno, fromAluno } from '@/lib/mapper.js'

const STORAGE_KEY = 'sgbl_alunos'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    console.warn('Falha ao ler alunos:', e)
    return []
  }
}

export function validarAluno(d) {
  const erros = []
  if (!d.nome || !d.nome.trim()) erros.push('nome é obrigatório')
  return { ok: erros.length === 0, erros }
}

export const useAlunosStore = defineStore('alunos', () => {
  const alunos = ref(load())
  const filtro = ref('')
  const filtroTurma = ref('')
  const filtroAno = ref('')
  const carregando = ref(false)
  const origem = ref('local')

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alunos.value))
    } catch (e) {
      toast('Falha ao salvar alunos localmente: ' + e.message, 'err')
      throw e
    }
  }

  async function carregar() {
    const cacheLocal = load()
    if (!isSupabaseConfigured()) {
      alunos.value = cacheLocal
      origem.value = 'local'
      return alunos.value
    }
    carregando.value = true
    try {
      const { data, error } = await supabase.from('alunos').select('*').order('nome')
      if (error) throw error
      const doBanco = (data || []).map(fromAluno)
      if (doBanco.length === 0 && cacheLocal.length > 0) {
        alunos.value = cacheLocal
        origem.value = 'local'
        return alunos.value
      }
      alunos.value = doBanco
      origem.value = 'supabase'
      try { save() } catch { /* ignora */ }
    } catch (e) {
      console.warn('[alunos] Supabase indisponível, usando cache local:', e?.message || e)
      alunos.value = cacheLocal
      origem.value = 'local'
    } finally {
      carregando.value = false
    }
    return alunos.value
  }

  const alunosFiltrados = computed(() => {
    const termo = filtro.value.trim().toLowerCase()
    let lista = alunos.value
    if (termo) {
      lista = lista.filter(a =>
        (a.nome || '').toLowerCase().includes(termo) ||
        (a.matricula || '').toLowerCase().includes(termo))
    }
    if (filtroTurma.value) {
      lista = lista.filter(a => (a.turma || '').trim() === filtroTurma.value)
    }
    if (filtroAno.value) {
      lista = lista.filter(a => String(a.anoLetivo ?? '') === String(filtroAno.value))
    }
    return [...lista].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' }))
  })

  const turmasDisponiveis = computed(() => {
    const set = new Set()
    for (const a of alunos.value) {
      const turma = (a.turma || '').trim()
      if (turma) set.add(turma)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }))
  })

  const anosDisponiveis = computed(() => {
    const set = new Set()
    for (const a of alunos.value) {
      if (a.anoLetivo != null && a.anoLetivo !== '') set.add(Number(a.anoLetivo))
    }
    return [...set].sort((a, b) => b - a)
  })

  function sanitizar(d) {
    const agora = new Date().toISOString()
    const ano = d.anoLetivo == null || d.anoLetivo === '' ? null : Number(d.anoLetivo)
    return {
      id: d.id || newId(),
      nome: (d.nome || '').trim(),
      telefone: (d.telefone || '').trim(),
      matricula: (d.matricula || '').trim(),
      turma: (d.turma || '').trim(),
      anoLetivo: Number.isFinite(ano) && ano > 0 ? ano : null,
      ativo: d.ativo !== false,
      criadoEm: d.criadoEm || agora
    }
  }

  async function adicionarAluno(dados) {
    const v = validarAluno(dados)
    if (!v.ok) throw new Error(v.erros.join('; '))
    const mat = (dados.matricula || '').trim()
    if (mat && alunos.value.some(a => a.matricula === mat)) throw new Error('Matrícula já cadastrada')
    const aluno = sanitizar(dados)
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('alunos').insert(toAluno(aluno))
      if (error) throw new Error('Supabase: ' + error.message)
    }
    alunos.value.push(aluno)
    try {
      save()
    } catch (e) {
      alunos.value = alunos.value.filter(a => a.id !== aluno.id)
      throw e
    }
    return aluno
  }

  async function editarAluno(id, dados) {
    const idx = alunos.value.findIndex(a => a.id === id)
    if (idx === -1) throw new Error('Aluno não encontrado')
    const v = validarAluno(dados)
    if (!v.ok) throw new Error(v.erros.join('; '))
    const mat = (dados.matricula || '').trim()
    if (mat && alunos.value.some(a => a.matricula === mat && a.id !== id)) throw new Error('Matrícula já cadastrada em outro aluno')
    const aluno = sanitizar({ ...dados, id, criadoEm: alunos.value[idx].criadoEm })
    const backup = { ...alunos.value[idx] }
    if (isSupabaseConfigured()) {
      const payload = toAluno(aluno)
      delete payload.id
      const { error } = await supabase.from('alunos').update(payload).eq('id', id)
      if (error) throw new Error('Supabase: ' + error.message)
    }
    alunos.value[idx] = aluno
    try {
      save()
    } catch (e) {
      alunos.value[idx] = backup
      throw e
    }
    return aluno
  }

  async function excluirAluno(id) {
    const index = alunos.value.findIndex(a => a.id === id)
    if (index === -1) throw new Error('Aluno não encontrado')
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('alunos').delete().eq('id', id)
      if (error) throw new Error('Supabase: ' + error.message)
    }
    const backup = [...alunos.value]
    alunos.value.splice(index, 1)
    try {
      save()
    } catch (e) {
      alunos.value = backup
      throw e
    }
  }

  async function aplicarImportacao(plano, { inativar = [] } = {}) {
    if (!plano) throw new Error('Prévia da importação não gerada')

    const selecionados = new Set()
    if (inativar === true) {
      for (const a of plano.possiveisSaidas || []) {
        if (a?.matricula) selecionados.add(a.matricula)
      }
    } else if (Array.isArray(inativar)) {
      for (const valor of inativar) {
        if (typeof valor === 'string') {
          selecionados.add(valor)
        } else if (valor && typeof valor === 'object') {
          if (valor.matricula) selecionados.add(valor.matricula)
          else if (valor.id) {
            const encontrado = alunos.value.find(a => a.id === valor.id)
            if (encontrado?.matricula) selecionados.add(encontrado.matricula)
          }
        }
      }
    }

    const inativarAgora = new Set(
      (plano.inativarAgora || []).map(a => a?.matricula).filter(Boolean)
    )

    const porMatricula = new Map()
    const entradas = [
      ...(plano.novos || []),
      ...(plano.atualizados || []),
      ...(plano.semMudanca || []),
      ...(plano.inativarAgora || [])
    ]

    for (const item of entradas) {
      if (!item?.matricula) continue
      const atual = porMatricula.get(item.matricula) || {}
      porMatricula.set(item.matricula, { ...atual, ...item })
    }

    for (const aluno of plano.possiveisSaidas || []) {
      if (!aluno?.matricula || !selecionados.has(aluno.matricula)) continue
      if (!porMatricula.has(aluno.matricula)) {
        porMatricula.set(aluno.matricula, { ...aluno, ativo: false })
      }
    }

    const rows = [...porMatricula.values()]
      .map(item => ({
        id: item.id || newId(),
        nome: (item.nome || '').trim(),
        // O CSV do SED não traz telefone: preserva o que já existe no cadastro.
        telefone: (item.telefone ?? item.aluno?.telefone ?? '').trim(),
        matricula: (item.matricula || '').trim(),
        turma: (item.turma || '').trim(),
        anoLetivo: item.anoLetivo == null || item.anoLetivo === '' ? null : Number(item.anoLetivo),
        ativo: item.ativo !== false &&
          !inativarAgora.has(item.matricula) &&
          !selecionados.has(item.matricula),
        criadoEm: item.criadoEm || item.aluno?.criadoEm || new Date().toISOString()
      }))
      .filter(item => item.nome && item.matricula)

    if (!rows.length) throw new Error('Nada para importar')

    function mesclarNoCache(lista) {
      for (const row of lista) {
        const idx = alunos.value.findIndex(a =>
          (row.id && a.id === row.id) || (row.matricula && a.matricula === row.matricula)
        )
        if (idx >= 0) alunos.value[idx] = row
        else alunos.value.push(row)
      }
    }

    if (!isSupabaseConfigured()) {
      const backup = alunos.value.map(a => ({ ...a }))
      try {
        mesclarNoCache(rows)
        save()
        return { gravados: rows.length, total: rows.length }
      } catch (e) {
        alunos.value = backup
        throw e
      }
    }

    let gravados = 0
    let cacheFalhou = false
    const TAMANHO_LOTE = 200

    try {
      for (let i = 0; i < rows.length; i += TAMANHO_LOTE) {
        const lote = rows.slice(i, i + TAMANHO_LOTE)
        const payload = lote.map(item => {
          const row = toAluno(item)
          // O banco gera/mantém o id; enviar id no upsert poderia trocar a PK.
          delete row.id
          return row
        })

        const { data, error } = await supabase
          .from('alunos')
          .upsert(payload, { onConflict: 'matricula' })
          .select()

        if (error) {
          const faltamColunas =
            error.code === '42703' ||
            error.code === 'PGRST204' ||
            /column .*turma.*does not exist|column .*ano_letivo.*does not exist/i.test(error.message) ||
            /could not find.*(turma|ano_letivo).*schema cache/i.test(error.message)
          if (faltamColunas) {
            throw new Error('Rode a migração sql/001_alunos_turma.sql no Supabase antes de importar.')
          }
          if (error.code === '42P10' || /no unique or exclusion constraint matching the ON CONFLICT/i.test(error.message)) {
            throw new Error('Falta o índice único de matrícula. Rode a migração sql/001_alunos_turma.sql no Supabase.')
          }
          throw new Error('Supabase: ' + error.message)
        }

        const confirmados = data && data.length ? data.map(fromAluno) : lote
        mesclarNoCache(confirmados)
        gravados += lote.length

        try {
          save()
        } catch {
          cacheFalhou = true
        }
      }

      try { await carregar() } catch { /* carregar já cai para o cache local */ }
      if (cacheFalhou) toast('Importação gravada, mas o cache local não pôde ser atualizado.', 'err')
      return { gravados, total: rows.length }
    } catch (e) {
      try { save() } catch { /* mantém o que já está em memória */ }
      const erro = new Error(e.message)
      erro.gravados = gravados
      erro.total = rows.length
      throw erro
    }
  }

  function getAlunoById(id) {
    return alunos.value.find(a => a.id === id)
  }

  return {
    alunos, filtro, filtroTurma, filtroAno, alunosFiltrados,
    turmasDisponiveis, anosDisponiveis, carregando, origem,
    carregar, adicionarAluno, editarAluno, excluirAluno, aplicarImportacao,
    getAlunoById, save, load, STORAGE_KEY
  }
})
