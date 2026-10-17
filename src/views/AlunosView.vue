<template>
  <section class="view active container">
    <h2 style="margin-bottom:16px">🎓 Alunos</h2>

    <div class="toolbar">
      <input v-model="store.filtro" type="text" placeholder="Filtrar por nome ou matrícula…" aria-label="Filtrar alunos" />
      <span class="count">{{ store.alunosFiltrados.length }} aluno(s) · {{ origemText }}</span>
    </div>

    <div v-if="store.alunosFiltrados.length===0" class="msg">Nenhum aluno cadastrado.</div>
    <ul v-else class="lista">
      <li v-for="a in store.alunosFiltrados" :key="a.id" class="linha">
        <div class="linha_info">
          <strong>{{ a.nome }}</strong>
          <span class="hint">Matrícula: {{ a.matricula || '—' }} · {{ a.telefone || '—' }}</span>
        </div>
        <span class="selo" :class="a.ativo ? 'ok' : 'off'">{{ a.ativo ? '✅ Ativo' : '⛔ Inativo' }}</span>
        <div class="linha_acoes">
          <button type="button" class="btn-ghost btn-small" @click="editar(a)">✏️</button>
          <button type="button" class="btn-ghost btn-small" @click="excluir(a.id)">🗑️</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlunosStore } from '@/stores/alunos.js'
import { toast } from '@/lib/utils.js'

const store = useAlunosStore()
const router = useRouter()

const origemText = computed(() => {
  if (store.carregando) return '⏳ sincronizando…'
  return store.origem === 'supabase' ? '☁️ nuvem' : '💾 local'
})

onMounted(() => store.carregar())

function editar(a) {
  router.push({ name: 'matriculas', query: { editar: a.id } })
}

async function excluir(id) {
  if (!window.confirm('Excluir este aluno?')) return
  try {
    await store.excluirAluno(id)
    toast('Aluno excluído', 'ok')
  } catch (err) {
    toast('Erro: ' + err.message, 'err')
  }
}
</script>

<style scoped>
.lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.linha {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
}
.linha_info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.linha_info .hint {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.selo {
  font-size: 0.85rem;
  white-space: nowrap;
}
.linha_acoes {
  display: flex;
  gap: 6px;
}
</style>
