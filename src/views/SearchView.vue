<template>
  <section class="view active container">
    <form class="search-bar" @submit.prevent="buscar">
      <input v-model="q" type="text" placeholder="Digite o nome de um livro, autor ou assunto…" />
      <button type="submit" :disabled="loading">{{ loading ? 'Buscando…' : 'Buscar' }}</button>
    </form>

    <div v-if="error" class="msg error">{{ error }}</div>
    <div v-else-if="!loading && fonte && resultados.length===0" class="msg">Nenhum livro encontrado. Tente outro termo.</div>
    <div v-else-if="!q && resultados.length===0" class="msg">Digite algo acima para buscar.</div>

    <div v-if="fonte" class="fonte" style="margin:12px 0; color:var(--muted); font-size:0.85rem">Resultados de: {{ fonte }}</div>

    <div v-if="resultados.length>0" class="grid">
      <div v-for="(b,i) in resultados" :key="i+b.titulo" class="card">
        <BookCover :src="b.capa" alt="Capa" />
        <div class="info">
          <div class="title">{{ b.titulo || 'Sem título' }}</div>
          <div class="author">{{ b.autor || 'Autor desconhecido' }}</div>
          <div v-if="meta(b).length" class="meta">{{ meta(b).join(' · ') }}</div>
          <div class="desc">{{ formatDesc(b.descricao) }}</div>
          <a v-if="b.link" :href="b.link" target="_blank" rel="noopener">Ver detalhes →</a>
          <div class="card-actions">
            <button class="btn-small" @click="preCadastro(b)">{{ jaNoAcervo(b) ? '✏️ Editar' : '➕ Pré-cadastro' }}</button>
          </div>
          <div v-if="b.fonte" class="hint" style="margin-top:6px; font-size:0.75rem">{{ b.fonte }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useBuscaLivros } from '@/composables/useBuscaLivros.js'
import { useAcervoStore } from '@/stores/acervo.js'
import { usePreCadastroStore } from '@/stores/precadastro.js'
import { formatDesc, toast, normIsbn } from '@/lib/utils.js'
import { metaBusca as meta } from '@/lib/meta.js'
import BookCover from '@/components/BookCover.vue'

const router = useRouter()
const acervo = useAcervoStore()
const { q, resultados, fonte, loading, error, buscarCompleta } = useBuscaLivros()

async function buscar() {
  if (!q.value.trim()) { error.value = 'Digite o nome de um livro.'; return }
  try {
    await buscarCompleta(q.value)
  } catch (e) {
    // error já setado no composable
    if (e.message.includes('429')) {
      error.value = 'Muitas buscas seguidas — aguarde 1 minuto.'
    }
  }
}

function jaNoAcervo(b) {
  if (!b.isbn) return acervo.livros.some(l=> l.titulo && l.titulo.trim().toLowerCase() === (b.titulo||'').trim().toLowerCase())
  return acervo.livros.some(l=> l.isbn && normIsbn(l.isbn)===normIsbn(b.isbn))
}

function preCadastro(b) {
  // guarda temporariamente via store precadastro para FormView consumir
  const existente = b.isbn
    ? acervo.livros.find(l=> l.isbn && normIsbn(l.isbn)===normIsbn(b.isbn))
    : acervo.livros.find(l=> l.titulo && l.titulo.trim().toLowerCase() === (b.titulo||'').trim().toLowerCase())
  if (existente) {
    router.push('/cadastrar/'+existente.id)
    toast('Livro já no acervo: aberto para edição.', 'ok')
  } else {
    usePreCadastroStore().set(b)
    router.push('/cadastrar')
    // FormView vai detectar na montagem
    toast('Pré-cadastro: revise os dados e clique em "Salvar livro".', 'ok')
  }
}
</script>

<style scoped>
.search-bar {
  display:flex;
  gap:8px;
  margin-bottom:16px;
}
.search-bar input { flex:1; }
.search-bar button {
  background: var(--accent);
  color: white;
  border:none;
  border-radius:10px;
  padding: 12px 18px;
  font-weight:700;
  cursor:pointer;
}
.search-bar button:disabled { opacity:0.6; cursor:wait; }
.msg.error { color: var(--err); }
.fonte { color: var(--muted); }
</style>
