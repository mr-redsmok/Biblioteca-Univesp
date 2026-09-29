import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const msg = ref('')
  const tipo = ref('')
  const visible = ref(false)
  let timer = null

  function show(m, tp = '') {
    msg.value = String(m ?? '')
    tipo.value = tp === 'ok' || tp === 'err' ? tp : ''
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 2600)
  }

  function hide() {
    visible.value = false
    clearTimeout(timer)
  }

  return { msg, tipo, visible, show, hide }
})
