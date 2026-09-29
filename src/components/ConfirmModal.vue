<template>
  <div
    v-if="show"
    class="modal-bg show"
    role="dialog"
    aria-modal="true"
    :aria-label="titulo"
    @click.self="emit('cancel')"
  >
    <div class="modal" role="document">
      <h3>{{ titulo }}</h3>
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

function onKey(e) {
  if (!props.show) return
  if (e.key === 'Escape') emit('cancel')
}

watch(() => props.show, async (v) => {
  if (v) {
    window.addEventListener('keydown', onKey)
    await nextTick()
    confirmBtn.value?.focus()
  } else {
    window.removeEventListener('keydown', onKey)
  }
}, { immediate: true })

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
