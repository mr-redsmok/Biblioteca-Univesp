<template>
  <div class="toolbar">
    <button class="btn-ghost btn-small" type="button" @click="triggerImport">⬆ Importar</button>
    <button class="btn-ghost btn-small" type="button" @click="exportar">⬇ Exportar</button>
    <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importar" />
  </div>

  <div v-if="importResult" class="import-result" :class="importResult.erros.length ? 'has-erros' : 'ok'">
    <div class="import-summary">
      ✅ {{ importResult.add }} importado(s)
      <span v-if="importResult.dup"> · {{ importResult.dup }} duplicado(s) ignorado(s)</span>
      <span v-if="importResult.erros.length"> · {{ importResult.erros.length }} erro(s)</span>
      <button class="btn-ghost btn-small" style="margin-left:8px" @click="importResult = null">✕</button>
    </div>
    <details v-if="importResult.erros.length" open>
      <summary>Ver erros ({{ importResult.erros.length }})</summary>
      <ul>
        <li v-for="(e, i) in importResult.erros" :key="i">{{ e }}</li>
      </ul>
    </details>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAcervoStore } from '@/stores/acervo.js'
import { toast } from '@/lib/utils.js'

const emit = defineEmits(['importado'])

const acervo = useAcervoStore()
const fileInput = ref(null)
const importResult = ref(null)

function exportar() {
  if (acervo.livros.length === 0) { toast('Acervo vazio — nada para exportar.', 'err'); return }
  const blob = new Blob([acervo.exportarJSON()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'acervo-biblioteca.json'
  a.click()
  URL.revokeObjectURL(url)
  toast('Acervo exportado!', 'ok')
}

function triggerImport() {
  fileInput.value.click()
}

function importar(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const arr = JSON.parse(reader.result)
      const res = acervo.importarJSON(arr)
      importResult.value = res
      const parts = [`${res.add} importado(s)`]
      if (res.dup) parts.push(`${res.dup} duplicado(s)`)
      if (res.erros.length) parts.push(`${res.erros.length} erro(s)`)
      toast('Importação: ' + parts.join(' · '), res.erros.length ? 'err' : 'ok')
      if (res.erros.length) {
        setTimeout(() => { if (importResult.value?.erros?.length) importResult.value = { ...res, _persist: true } }, 10000)
      } else {
        setTimeout(() => { importResult.value = null }, 5000)
      }
      emit('importado', res)
    } catch (err) {
      importResult.value = { add: 0, dup: 0, erros: [err.message] }
      toast('Importação falhou: ' + err.message, 'err')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}
</script>

<style scoped>
.import-result {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.85rem;
}
.import-result.ok { border-color: var(--ok); }
.import-result.has-erros { border-color: var(--err); }
.import-summary { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.import-result details { margin-top: 8px; }
.import-result details ul { margin: 6px 0 0 18px; color: var(--err); }
</style>
