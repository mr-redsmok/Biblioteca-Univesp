import { reactive, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAcervoStore } from '@/stores/acervo.js'
import { usePreCadastroStore } from '@/stores/precadastro.js'
import { toast, normIsbn } from '@/lib/utils.js'
import { peekProximoTombo } from '@/lib/tombo.js'
import { useAutofill } from '@/composables/useBuscaLivros.js'
import { isbnDuplicado } from '@/lib/validate.js'

function vazio() {
  return {
    titulo: '',
    autor: '',
    editora: '',
    isbn: '',
    ano: '',
    paginas: '',
    exemplares: 1,
    capa: '',
    descricao: '',
    estadoLivro: '',
    metodoAquisicao: ''
  }
}

/**
 * Lógica do formulário de cadastro/edição (extraída do FormView).
 * Mantém comportamento: pré-cadastro, dirty-guard, hint de tombos,
 * aviso ISBN duplicado, autofill e salvar.
 */
export function useLivroForm() {
  const acervo = useAcervoStore()
  const precadastro = usePreCadastroStore()
  const route = useRoute()
  const router = useRouter()

  const form = reactive(vazio())
  const salvando = ref(false)
  const autofillError = ref('')

  const editando = computed(() => !!route.params.id)
  const livroEditando = computed(() => editando.value ? acervo.getLivroById(route.params.id) : null)

  function preencherForm(livro) {
    form.titulo = livro.titulo || ''
    form.autor = livro.autor || ''
    form.editora = livro.editora || ''
    form.isbn = livro.isbn || ''
    form.ano = livro.ano || ''
    form.paginas = livro.paginas || ''
    form.exemplares = livro.exemplares ?? 1
    form.capa = livro.capa || ''
    form.descricao = livro.descricao || ''
    form.estadoLivro = livro.estadoLivro || ''
    form.metodoAquisicao = livro.metodoAquisicao || ''
  }

  function limpar() {
    Object.assign(form, vazio())
    salvando.value = false
    if (editando.value) router.push('/cadastrar')
  }

  const isDirty = computed(() => {
    if (salvando.value) return false
    if (editando.value && livroEditando.value) {
      const o = livroEditando.value
      return form.titulo !== (o.titulo || '') ||
        form.autor !== (o.autor || '') ||
        form.editora !== (o.editora || '') ||
        form.isbn !== (o.isbn || '') ||
        String(form.ano || '') !== String(o.ano || '') ||
        String(form.paginas || '') !== String(o.paginas || '') ||
        Number(form.exemplares || 1) !== Number(o.exemplares || 1) ||
        form.capa !== (o.capa || '') ||
        form.descricao !== (o.descricao || '') ||
        form.estadoLivro !== (o.estadoLivro || '') ||
        form.metodoAquisicao !== (o.metodoAquisicao || '')
    }
    return !!(form.titulo.trim() || form.autor.trim() || form.editora.trim() || form.isbn.trim() || form.ano || form.paginas || form.capa.trim() || form.descricao.trim() || form.estadoLivro || form.metodoAquisicao)
  })

  function handleBeforeUnload(e) {
    if (isDirty.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

  onBeforeRouteLeave((to, from, next) => {
    if (isDirty.value) {
      const ok = window.confirm('Você tem alterações não salvas. Deseja sair sem salvar?')
      if (!ok) return next(false)
    }
    next()
  })

  onMounted(() => {
    if (livroEditando.value) {
      preencherForm(livroEditando.value)
    } else {
      const b = precadastro.consume()
      if (b) {
        preencherForm({
          titulo: b.titulo || '',
          autor: b.autor || '',
          editora: b.editora || '',
          isbn: b.isbn || '',
          ano: b.ano || '',
          paginas: b.paginas || '',
          capa: b.capa || '',
          descricao: b.descricao || '',
          exemplares: 1,
          estadoLivro: '',
          metodoAquisicao: ''
        })
        toast('Pré-cadastro carregado de "' + (b.titulo || '') + '". Revise e salve.', 'ok')
      }
    }
  })

  watch(() => route.params.id, (id) => {
    if (id) {
      const l = acervo.getLivroById(id)
      if (l) preencherForm(l)
    } else {
      limpar()
    }
  })

  const hintTombos = computed(() => {
    const qtd = Number(form.exemplares) || 1
    if (editando.value && livroEditando.value?.exemplaresLista?.length) {
      const tombos = livroEditando.value.exemplaresLista.map(e => e.tombo).join(', ')
      return 'Tombos atuais: ' + tombos
    }
    return 'Tombos que serão gerados: ' + peekProximoTombo(qtd).join(', ')
  })

  const isbnNormalizado = computed(() => normIsbn(form.isbn))
  const avisoIsbnDuplicado = computed(() => {
    const n = isbnNormalizado.value
    if (!n || n.length < 10) return null
    const idIgnorar = editando.value ? route.params.id : null
    if (isbnDuplicado(n, acervo.livros, idIgnorar)) {
      return acervo.livros.find(l => l.isbn === n && l.id !== idIgnorar) || { titulo: 'outro livro', exemplaresLista: [] }
    }
    return null
  })

  const { loading: autofillLoading, preencher: autofillPreencher } = useAutofill()

  async function autoPreencher() {
    if (editando.value) { toast('Auto preencher não disponível em modo de edição.', 'err'); return }
    const isbn = form.isbn.trim()
    const titulo = form.titulo.trim()
    if (!isbn && !titulo) { toast('Digite o ISBN ou o Título para buscar os dados.', 'err'); return }

    autofillError.value = ''
    try {
      const res = await autofillPreencher({ isbn, titulo, formValues: form })
      if (!res) return
      const { patch, preenchidos, fonte } = res
      for (const k in patch) form[k] = patch[k]
      if (import.meta.env.DEV) console.debug('[autofill] patch', patch, 'fonte', fonte)
      if (preenchidos === 0) toast('Nada a preencher: campos já estavam completos.', 'ok')
      else toast(`Preenchido (${fonte}): ${preenchidos} campo(s) [${Object.keys(patch).join(', ')}]`, 'ok')
    } catch (err) {
      if (err?.name === 'AbortError') return
      const msg = err.message.includes('429') ? 'Muitas buscas — aguarde 1 minuto.' : err.message
      autofillError.value = msg
      toast('Busca falhou: ' + msg, 'err')
    }
  }

  function salvar() {
    const dados = { ...form }
    salvando.value = true
    try {
      if (editando.value) {
        acervo.editarLivro(route.params.id, dados)
        toast('Livro atualizado!', 'ok')
      } else {
        acervo.adicionarLivro(dados)
        toast('Livro adicionado ao acervo!', 'ok')
      }
      limpar()
      router.push('/catalogo')
    } catch (err) {
      salvando.value = false
      toast('Erro: ' + err.message, 'err')
    }
  }

  return {
    form, acervo, editando,
    hintTombos, isbnNormalizado, avisoIsbnDuplicado,
    autofillLoading, autofillError,
    autoPreencher, salvar, limpar
  }
}
