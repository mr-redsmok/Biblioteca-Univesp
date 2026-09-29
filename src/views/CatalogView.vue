<template>
  <section class="view active container">
    <div class="toolbar">
      <input v-model="acervo.filtroTexto" type="text" placeholder="Filtrar por título, autor, ISBN, editora ou tombo…" aria-label="Filtrar catálogo" />
      <span class="count">{{ countText }}</span>
    </div>

    <FiltersBar />
    <ImportExport />

    <div v-if="acervo.livros.length===0" class="msg">Nenhum livro no acervo ainda. Cadastre ou busque livros.</div>
    <div v-else-if="acervo.livrosFiltrados.length===0" class="msg">Nenhum livro corresponde ao filtro.</div>

    <div v-else class="grid">
      <BookCard v-for="l in acervo.livrosFiltrados" :key="l.id" :livro="l" @excluir="excluir" />
    </div>
  </section>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useAcervoStore } from '@/stores/acervo.js'
import BookCard from '@/components/BookCard.vue'
import FiltersBar from '@/components/FiltersBar.vue'
import ImportExport from '@/components/ImportExport.vue'

const acervo = useAcervoStore()
const abrirModalExcluir = inject('modalExcluir')

const countText = computed(() => {
  const total = acervo.livros.length
  const filtrados = acervo.livrosFiltrados.length
  return total + (filtrados !== total ? ' · ' + filtrados + ' filtrados' : '') + ' livro(s)'
})

function excluir(id) {
  abrirModalExcluir(id)
}

</script>
