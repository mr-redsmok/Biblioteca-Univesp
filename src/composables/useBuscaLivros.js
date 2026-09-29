import { ref } from 'vue'
import { buscarLivros } from '@/lib/api.js'
import { escolherMelhorResultado, enriquecerLivro, aplicarAutopreenchimento } from '@/lib/autofill.js'

export function useBuscaLivros() {
  const q = ref('')
  const resultados = ref([])
  const fonte = ref('')
  const loading = ref(false)
  const error = ref(null)
  let controller = null
  let debounceTimer = null

  function abort() {
    if (controller) {
      controller.abort()
      controller = null
    }
  }

  async function buscar(termo, { forceGoogle = false, debounceMs = 0 } = {}) {
    const t = (termo ?? q.value).trim()
    if (!t) {
      error.value = 'Digite o nome de um livro.'
      return
    }

    // debounce opcional
    if (debounceMs > 0) {
      return new Promise((resolve) => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          const r = await buscar(termo, { forceGoogle, debounceMs: 0 })
          resolve(r)
        }, debounceMs)
      })
    }

    abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      const r = await buscarLivros(t, { signal: controller.signal, forceGoogle })
      resultados.value = r.livros
      fonte.value = r.fonte
      return r
    } catch (e) {
      if (e.name === 'AbortError') return
      error.value = e.message
      resultados.value = []
      fonte.value = ''
      throw e
    } finally {
      loading.value = false
    }
  }

  // Para auto-preenchimento: busca econômica (OL primeiro)
  async function buscarParaAutofill(termo) {
    return buscar(termo, { forceGoogle: false })
  }

  // Para aba Buscar: busca completa (paralela)
  async function buscarCompleta(termo) {
    return buscar(termo, { forceGoogle: true })
  }

  function limpar() {
    resultados.value = []
    fonte.value = ''
    error.value = null
  }

  return {
    q, resultados, fonte, loading, error,
    buscar, buscarParaAutofill, buscarCompleta, limpar, abort
  }
}

export function useAutofill() {
  const loading = ref(false)
  const error = ref(null)
  let controller = null

  function abort() {
    if (controller) {
      controller.abort()
      controller = null
    }
  }

  // Novo: preenche a partir de isbn e/ou titulo, com Abort e mescla enriquecida
  // Retorna { livro, fonte, patch, preenchidos } pronto para aplicar no form
  async function preencher({ isbn = '', titulo = '', formValues = null } = {}) {
    const isbnTrim = (isbn || '').trim()
    const tituloTrim = (titulo || '').trim()
    if (!isbnTrim && !tituloTrim) throw new Error('Digite o ISBN ou o Título para buscar os dados.')

    abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      const signal = controller.signal

      let resultados = []
      let fontes = []

      const buscar = async (termo) => {
        try {
          const r = await buscarLivros(termo, { signal, forceGoogle: true })
          return r
        } catch (e) {
          if (e.name === 'AbortError') throw e
          return { livros: [], fonte: '', error: e.message }
        }
      }

      if (isbnTrim && isbnTrim.length >= 10) {
        const rIsbn = await buscar(isbnTrim)
        if (rIsbn.livros?.length) {
          resultados.push(...rIsbn.livros)
          if (rIsbn.fonte) fontes.push(rIsbn.fonte)
        }
        const temCompleto = rIsbn.livros?.some(l => l.autor && l.ano && l.paginas)
        if ((!temCompleto || !rIsbn.livros?.length) && tituloTrim) {
          const rTit = await buscar(tituloTrim)
          if (rTit.livros?.length) {
            resultados.push(...rTit.livros)
            if (rTit.fonte) fontes.push(rTit.fonte)
          }
        }
      } else if (tituloTrim) {
        const rTit = await buscar(tituloTrim)
        if (rTit.livros?.length) {
          resultados.push(...rTit.livros)
          if (rTit.fonte) fontes.push(rTit.fonte)
        }
      }

      if (!resultados.length) throw new Error('nenhum resultado encontrado para ISBN/título informados')

      const melhor = escolherMelhorResultado(resultados, tituloTrim, '', isbnTrim)
      if (!melhor) throw new Error('nenhum resultado confiável (' + fontes.join(' + ') + '). Verifique e tente novamente.')
      const livro = enriquecerLivro(melhor, resultados)
      const fonte = fontes.filter(Boolean).join(' + ') || livro.fonte

      // se formValues fornecido, calcula patch
      if (formValues) {
        const { preenchidos, patch } = aplicarAutopreenchimento(livro, formValues)
        return { livro, fonte, patch, preenchidos, resultados }
      }
      return { livro, fonte, resultados }
    } catch (e) {
      if (e.name === 'AbortError') return null
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // compat: preencher por termo único (legado)
  async function preencherPorTermo(termo, tipo = 'titulo') {
    if (tipo === 'isbn') return preencher({ isbn: termo, titulo: '' })
    return preencher({ isbn: '', titulo: termo })
  }

  return { loading, error, preencher, preencherPorTermo, abort }
}
