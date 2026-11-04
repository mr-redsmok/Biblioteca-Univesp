<template>
  <div
    v-if="show"
    class="modal-bg show"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
    @click.self="emit('cancel')"
  >
    <div ref="modalEl" class="modal" role="document">
      <h3 id="confirm-modal-title">{{ titulo }}</h3>
      <p>{{ texto }}</p>
      <div class="btn-group">
        <button ref="confirmBtn" class="btn-danger" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
        <button class="btn-ghost" @click="emit('cancel')">
          {{ cancelLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  titulo: { type: String, default: 'Confirmar' },
  texto: { type: String, default: 'Tem certeza?' },
  confirmLabel: { type: String, default: 'Excluir' },
  cancelLabel: { type: String, default: 'Cancelar' }
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmBtn = ref(null)
const modalEl = ref(null)
let elementoAnterior = null

function focaveis() {
  return Array.from(
    modalEl.value?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
  ).filter(el => !el.disabled && el.offsetParent !== null)
}

function onKey(e) {
  if (!props.show) return
  if (e.key === 'Escape') { emit('cancel'); return }
  if (e.key !== 'Tab') return

  const lista = focaveis()
  if (!lista.length) { e.preventDefault(); return }

  const primeiro = lista[0]
  const ultimo = lista[lista.length - 1]
  const ativo = document.activeElement
  const dentro = modalEl.value?.contains(ativo)

  if (e.shiftKey) {
    if (ativo === primeiro || !dentro) { e.preventDefault(); ultimo.focus() }
  } else {
    if (ativo === ultimo || !dentro) { e.preventDefault(); primeiro.focus() }
  }
}

watch(() => props.show, async (v) => {
  if (v) {
    elementoAnterior = document.activeElement
    window.addEventListener('keydown', onKey)
    await nextTick()
    confirmBtn.value?.focus()
  } else {
    window.removeEventListener('keydown', onKey)
    if (elementoAnterior && elementoAnterior.isConnected && typeof elementoAnterior.focus === 'function') {
      elementoAnterior.focus()
    } else {
      document.querySelector('main')?.focus()
    }
    elementoAnterior = null
  }
}, { immediate: true })

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
