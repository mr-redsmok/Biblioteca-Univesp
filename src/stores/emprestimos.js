import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { toast } from '@/lib/utils.js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase.js'
import { getDiasEmprestimoPadrao } from '@/lib/configEmprestimo.js'

const STORAGE_KEY = 'sgbl_emprestimos'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    console.warn('Falha ao ler empréstimos:', e)
    return []
  }
}

function diasEntre(a, b) {
  const ms = new Date(a).setHours(0, 0, 0, 0) - new Date(b).setHours(0, 0, 0, 0)
  return Math.round(ms / 86400000)
}

export const useEmprestimosStore = defineStore('emprestimos', () => {
  const lista = ref(load())
  const carregando = ref(false)
  const origem = ref('local')

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.value))
    } catch (e) {
      toast('Falha ao salvar empréstimos localmente: ' + e.message, 'err')
      throw e
    }
  }

  function normalizar(row) {
    return {
      id: row.id,
      exemplar_id: row.exemplar_id,
      aluno_id: row.aluno_id,
      data_emprestimo: row.data_emprestimo,
      dias: row.dias ?? 14,
      data_devolucao_prevista: row.data_devolucao_prevista || null,
      data_devolucao_real: row.data_devolucao_real || null,
      status: row.status || 'emprestado',
      observacao: row.observacao || '',
      criado_em: row.criado_em || null,
      aluno_nome: row.alunos?.nome || row.aluno_nome || '',
      aluno_matricula: row.alunos?.matricula || '',
      tombo: row.exemplares?.tombo || row.tombo || '',
      livro_titulo: row.exemplares?.livro?.titulo || row.livro_titulo || ''
    }
  }

  async function carregar() {
    const cacheLocal = load()
    if (!isSupabaseConfigured()) {
      lista.value = cacheLocal.map(normalizar)
      origem.value = 'local'
      return lista.value
    }
    carregando.value = true
    try {
      const { data, error } = await supabase
        .from('emprestimos')
        .select('*, alunos(nome,matricula), exemplares(tombo, livro(titulo))')
        .order('criado_em', { ascending: false })
      if (error) throw error
      lista.value = (data || []).map(normalizar)
      origem.value = 'supabase'
      try { save() } catch { /* ignora */ }
    } catch (e) {
      console.warn('[emprestimos] Supabase indisponível, usando cache local:', e?.message || e)
      lista.value = cacheLocal.map(normalizar)
      origem.value = 'local'
    } finally {
      carregando.value = false
    }
    return lista.value
  }

  const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }

  const ativos = computed(() => lista.value.filter(e => e.status === 'emprestado'))

  const atrasados = computed(() => ativos.value
    .filter(e => e.data_devolucao_prevista && diasEntre(hoje(), e.data_devolucao_prevista) > 0)
    .map(e => ({ ...e, dias_atraso: diasEntre(hoje(), e.data_devolucao_prevista) }))
    .sort((a, b) => b.dias_atraso - a.dias_atraso))

  const proximos = computed(() => ativos.value
    .filter(e => {
      if (!e.data_devolucao_prevista) return false
      const diff = diasEntre(e.data_devolucao_prevista, hoje())
      return diff >= 0 && diff <= 3
    })
    .sort((a, b) => new Date(a.data_devolucao_prevista) - new Date(b.data_devolucao_prevista)))

  const historico = computed(() => lista.value.filter(e => e.status !== 'emprestado'))

  function idsEmprestados() {
    return new Set(ativos.value.map(e => e.exemplar_id))
  }

  async function criar({ exemplar_id, aluno_id, dias = getDiasEmprestimoPadrao(), observacao = '' }) {
    if (!exemplar_id) throw new Error('Escolha o exemplar (tombo)')
    if (!aluno_id) throw new Error('Escolha o aluno')
    const d = Math.max(1, Math.min(90, Number(dias) || getDiasEmprestimoPadrao()))
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('emprestimos').insert({
        exemplar_id, aluno_id, dias: d, observacao: observacao || null
      })
      if (error) {
        if (error.code === '23505' || String(error.message).includes('idx_exemplar_emprestado')) {
          throw new Error('Exemplar já emprestado')
        }
        throw new Error('Supabase: ' + error.message)
      }
      await carregar()
      return true
    }
    const agora = new Date().toISOString()
    lista.value.unshift(normalizar({
      id: 'local-' + Date.now().toString(36),
      exemplar_id, aluno_id, dias: d, observacao,
      data_emprestimo: agora,
      data_devolucao_prevista: new Date(Date.now() + d * 86400000).toISOString(),
      status: 'emprestado', criado_em: agora
    }))
    save()
    return true
  }

  async function devolver(id) {
    const item = lista.value.find(e => e.id === id)
    if (!item) throw new Error('Empréstimo não encontrado')
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('emprestimos').update({
        status: 'devolvido', data_devolucao_real: new Date().toISOString()
      }).eq('id', id)
      if (error) throw new Error('Supabase: ' + error.message)
      await carregar()
      return true
    }
    item.status = 'devolvido'
    item.data_devolucao_real = new Date().toISOString()
    save()
    return true
  }

  return {
    lista, carregando, origem,
    ativos, atrasados, proximos, historico,
    carregar, criar, devolver, idsEmprestados, save, load, STORAGE_KEY
  }
})
