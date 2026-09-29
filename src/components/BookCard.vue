<template>
  <div class="card">
    <BookCover :src="livro.capa" :alt="'Capa de ' + livro.titulo" />
    <div class="info">
      <div class="title">{{ livro.titulo }}</div>
      <div class="author">{{ livro.autor || 'Autor desconhecido' }}</div>
      <div v-if="bits.length" class="meta">{{ bits.join(' · ') }}</div>
      <div class="desc">{{ formatDesc(livro.descricao) }}</div>
      <span class="badge" :class="livro.exemplares > 0 ? 'ok' : 'err'">
        {{ livro.exemplares }} exemplar(es) {{ livro.exemplares > 0 ? 'disponível(is)' : '— esgotado' }}
      </span>
      <div class="card-actions">
        <router-link :to="'/cadastrar/' + livro.id">✏️ Editar</router-link> &nbsp;
        <a href="#" style="color:var(--err)" @click.prevent="emit('excluir', livro.id)">🗑️ Excluir</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BookCover from '@/components/BookCover.vue'
import { formatDesc } from '@/lib/utils.js'
import { metaBits } from '@/lib/meta.js'

const props = defineProps({
  livro: { type: Object, required: true }
})

const emit = defineEmits(['excluir'])

const bits = computed(() => metaBits(props.livro))
</script>
