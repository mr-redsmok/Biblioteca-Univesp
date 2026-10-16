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
  if (d.email && d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) erros.push('email inválido')
  return { ok: erros.length === 0, erros }
}

export const useAlunosStore = defineStore('alunos', () => {
  const alunos = ref(load())
  const filtro = ref('')
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
        (a.matricula || '').toLowerCase().includes(termo) ||
        (a.email || '').toLowerCase().includes(termo))
    }
    return [...lista].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' }))
  })

  function sanitizar(d) {
    const agora = new Date().toISOString()
    return {
      id: d.id || newId(),
      nome: (d.nome || '').trim(),
      email: (d.email || '').trim(),
      telefone: (d.telefone || '').trim(),
      matricula: (d.matricula || '').trim(),
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

  function getAlunoById(id) {
    return alunos.value.find(a => a.id === id)
  }

  return {
    alunos, filtro, alunosFiltrados, carregando, origem,
    carregar, adicionarAluno, editarAluno, excluirAluno, getAlunoById,
    save, load, STORAGE_KEY
  }
})
