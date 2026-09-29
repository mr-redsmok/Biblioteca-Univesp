import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'sgbl_precadastro'

/**
 * Pré-cadastro vindo da busca (SearchView -> FormView).
 * Mantém em memória + espelha em sessionStorage para suportar reload.
 * FormView deve usar consume() (lê e limpa atomicamente).
 */
export const usePreCadastroStore = defineStore('precadastro', () => {
  const dados = ref(null)

  function set(b) {
    dados.value = b ? { ...b } : null
    try {
      if (b) sessionStorage.setItem(KEY, JSON.stringify(b))
      else sessionStorage.removeItem(KEY)
    } catch { /* storage indisponível — segue só memória */ }
  }

  function consume() {
    if (dados.value) {
      const b = dados.value
      clear()
      return b
    }
    try {
      const raw = sessionStorage.getItem(KEY)
      clear()
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      clear()
      return null
    }
  }

  function clear() {
    dados.value = null
    try { sessionStorage.removeItem(KEY) } catch { /* ignora */ }
  }

  return { dados, set, consume, clear }
})
