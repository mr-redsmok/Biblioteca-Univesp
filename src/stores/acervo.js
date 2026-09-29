import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { validarLivro, sanitizar, isbnDuplicado } from '@/lib/validate.js'
import { gerarTombo } from '@/lib/tombo.js'
import { normIsbn, toast, newId } from '@/lib/utils.js'

const STORAGE_KEY = 'sgbl_livros'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    console.warn('Falha ao ler acervo:', e)
    return []
  }
}

/**
 * NOTA (limitação documentada em docs/gestao-exemplares.md):
 * Exemplares hoje são só {id, tombo} com quantidade. Não há status individual
 * (disponivel/danificado/perdido). Remover 1 exemplar remove sempre o último.
 * Próxima fase: adicionar status por exemplar sem quebrar geração de tombo.
 */
function gerarExemplaresLista(qtd) {
  const lista = []
  for (let i = 0; i < qtd; i++) {
    lista.push({ id: newId(), tombo: gerarTombo() })
  }
  return lista
}

export const useAcervoStore = defineStore('acervo', () => {
  const livros = ref(load())
  const filtroTexto = ref('')
  const filtroAutor = ref('')
  const filtroEditora = ref('')
  const filtroAno = ref('')
  const filtroOrdem = ref('titulo-az')

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(livros.value))
    } catch (e) {
      const isQuota = e.name === 'QuotaExceededError' || e.code === 22 || String(e.message).toLowerCase().includes('quota')
      const msg = isQuota
        ? 'Armazenamento cheio: não foi possível salvar. Exporte o acervo e remova alguns livros ou capas.'
        : 'Falha ao salvar no armazenamento local: ' + e.message
      toast(msg, 'err')
      console.error('[acervo] save falhou', e)
      throw new Error(msg)
    }
  }

  // Computed: sugestões para datalist (titulo, autor, editora, isbn)
  const sugestoes = computed(() => {
    const uniq = (campo) => [...new Set(livros.value.map(l => (l[campo] || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'))
    return {
      titulo: uniq('titulo'),
      autor: uniq('autor'),
      editora: uniq('editora'),
      isbn: uniq('isbn')
    }
  })

  const autoresUnicos = computed(() => [...new Set(livros.value.map(l => (l.autor || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt')))
  const editorasUnicas = computed(() => [...new Set(livros.value.map(l => (l.editora || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt')))

  const livrosFiltrados = computed(() => {
    const termo = filtroTexto.value.trim().toLowerCase()
    const autor = filtroAutor.value.trim().toLowerCase()
    const editora = filtroEditora.value.trim().toLowerCase()
    const ano = String(filtroAno.value || '').trim()
    const ordem = filtroOrdem.value

    let lista = livros.value.filter(l => {
      const titulo = (l.titulo || '').toLowerCase()
      const aut = (l.autor || '').toLowerCase()
      const edi = (l.editora || '').toLowerCase()
      const isb = (l.isbn || '').toLowerCase()
      const tombos = (l.exemplaresLista || []).map(e => (e.tombo || '').toLowerCase()).join(' ')
      return (!termo || titulo.includes(termo) || aut.includes(termo) || edi.includes(termo) || isb.includes(termo) || tombos.includes(termo)) &&
        (!autor || aut.includes(autor)) &&
        (!editora || edi.includes(editora)) &&
        (!ano || String(l.ano || '') === ano)
    })
    const pt = (a, b) => (a || '').localeCompare(b || '', 'pt', { sensitivity: 'base' })
    if (ordem === 'titulo-az') lista = [...lista].sort((a, b) => pt(a.titulo, b.titulo))
    else if (ordem === 'titulo-za') lista = [...lista].sort((a, b) => pt(b.titulo, a.titulo))
    else if (ordem === 'ano-desc') lista = [...lista].sort((a, b) => (b.ano || 0) - (a.ano || 0))
    else if (ordem === 'ano-asc') lista = [...lista].sort((a, b) => (a.ano || 0) - (b.ano || 0))
    return lista
  })

  function adicionarLivro(dados) {
    const v = validarLivro(dados)
    if (!v.ok) throw new Error(v.erros.join('; '))
    if (isbnDuplicado(normIsbn(dados.isbn), livros.value)) throw new Error('ISBN já cadastrado no acervo')
    const livro = sanitizar(dados)
    const qtd = Math.max(1, Number(dados.exemplares) || 1)
    livro.exemplaresLista = gerarExemplaresLista(qtd)
    livro.exemplares = qtd
    livros.value.push(livro)
    try {
      save()
    } catch (e) {
      // rollback: remove o que foi adicionado
      livros.value = livros.value.filter(l => l.id !== livro.id)
      throw e
    }
    return livro
  }

  function editarLivro(id, dados) {
    const idx = livros.value.findIndex(l => l.id === id)
    if (idx === -1) throw new Error('Livro não encontrado')
    const v = validarLivro(dados)
    if (!v.ok) throw new Error(v.erros.join('; '))
    if (isbnDuplicado(normIsbn(dados.isbn), livros.value, id)) throw new Error('ISBN já cadastrado em outro livro')
    const livro = sanitizar({ ...dados, id, criadoEm: livros.value[idx].criadoEm })
    const antigo = livros.value[idx]
    const backup = { ...antigo, exemplaresLista: [...(antigo.exemplaresLista||[])] }
    const novaQtd = Math.max(1, Number(dados.exemplares) || 1)
    const listaExistente = antigo.exemplaresLista || []
    if (novaQtd > listaExistente.length) {
      const novos = gerarExemplaresLista(novaQtd - listaExistente.length)
      livro.exemplaresLista = [...listaExistente, ...novos]
    } else {
      livro.exemplaresLista = listaExistente.slice(0, novaQtd)
    }
    livro.exemplares = novaQtd
    livros.value[idx] = livro
    try {
      save()
    } catch (e) {
      livros.value[idx] = backup
      throw e
    }
    return livro
  }

  function excluirLivro(id) {
    const antes = livros.value.length
    const backup = [...livros.value]
    livros.value = livros.value.filter(l => l.id !== id)
    if (livros.value.length === antes) throw new Error('Livro não encontrado')
    try {
      save()
    } catch (e) {
      livros.value = backup
      throw e
    }
  }

  function exportarJSON() {
    return JSON.stringify(livros.value, null, 2)
  }

  function importarJSON(arr) {
    if (!Array.isArray(arr)) throw new Error('arquivo inválido')
    let add = 0, dup = 0
    const erros = []
    for (const item of arr) {
      try {
        adicionarLivro(item)
        add++
      } catch (err) {
        if (String(err.message).includes('ISBN')) dup++
        else erros.push(err.message)
      }
    }
    return { add, dup, erros }
  }

  // Para compat com código que acessava storage direto
  function getLivroById(id) {
    return livros.value.find(l => l.id === id)
  }

  return {
    livros,
    filtroTexto, filtroAutor, filtroEditora, filtroAno, filtroOrdem,
    livrosFiltrados, sugestoes, autoresUnicos, editorasUnicas,
    adicionarLivro, editarLivro, excluirLivro, save, load,
    exportarJSON, importarJSON, getLivroById,
    STORAGE_KEY
  }
})
