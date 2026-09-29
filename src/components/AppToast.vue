<template>
  <div
    id="toast"
    :class="[toast.tipo, { show: toast.visible }]"
    role="status"
    aria-live="polite"
  >{{ toast.msg }}</div>
</template>

<script setup>
import { useToastStore } from '@/stores/toast.js'

const toast = useToastStore()
</script>
