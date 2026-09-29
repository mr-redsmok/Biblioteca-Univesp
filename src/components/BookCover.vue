<template>
  <div class="thumb">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      loading="lazy"
      @error="failed = true"
    />
    <div v-else class="no-img">Sem capa</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: 'Capa' }
})

const failed = ref(false)

watch(() => props.src, () => { failed.value = false })
</script>
