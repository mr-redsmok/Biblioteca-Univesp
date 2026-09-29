import { reactive } from 'vue'
import { useAcervoStore } from '@/stores/acervo.js'

export function useConfirmModal() {
  const modal = reactive({
    show: false,
    titulo: 'Excluir livro',
    texto: 'Tem certeza?',
    id: null
  })

  function abrir(id) {
    const acervo = useAcervoStore()
    const livro = acervo.getLivroById(id)
    modal.id = id
    modal.titulo = 'Excluir livro'
    modal.texto = livro ? `Tem certeza que deseja excluir "${livro.titulo}"?` : 'Tem certeza?'
    modal.show = true
  }

  function fechar() {
    modal.show = false
    modal.id = null
  }

  return { modal, abrir, fechar }
}
