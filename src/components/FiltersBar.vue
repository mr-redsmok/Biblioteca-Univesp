<template>
  <div class="filters-row">
    <label>Ordenar
      <select v-model="acervo.filtroOrdem" aria-label="Ordenar catálogo">
        <option value="titulo-az">Título A–Z</option>
        <option value="titulo-za">Título Z–A</option>
        <option value="ano-desc">Ano ↓</option>
        <option value="ano-asc">Ano ↑</option>
      </select>
    </label>
    <label>Autor
      <select v-model="acervo.filtroAutor" aria-label="Filtrar por autor">
        <option value="">Todos</option>
        <option v-for="a in acervo.autoresUnicos" :key="a" :value="a">{{ a }}</option>
      </select>
    </label>
    <label>Editora
      <select v-model="acervo.filtroEditora" aria-label="Filtrar por editora">
        <option value="">Todas</option>
        <option v-for="e in acervo.editorasUnicas" :key="e" :value="e">{{ e }}</option>
      </select>
    </label>
    <label>
      <span>Ano</span>
      <input v-model="acervo.filtroAno" type="number" min="0" max="2100" placeholder="Ex.: 1999" aria-label="Filtrar por ano" />
    </label>
    <button v-if="temFiltro" class="btn-ghost btn-small" title="Limpar filtros" @click="limpar">✕ Limpar</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAcervoStore } from '@/stores/acervo.js'

const acervo = useAcervoStore()

const temFiltro = computed(() => acervo.filtroTexto || acervo.filtroAutor || acervo.filtroEditora || acervo.filtroAno)

function limpar() {
  acervo.filtroTexto = ''
  acervo.filtroAutor = ''
  acervo.filtroEditora = ''
  acervo.filtroAno = ''
}
</script>
