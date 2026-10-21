<template>
  <section class="view active container">
    <h2 style="margin-bottom:16px">📦 Empréstimos</h2>

    <div class="avisos">
      <div class="aviso err">
        <strong>🔴 Atrasados ({{ store.atrasados.length }})</strong>
        <ul v-if="store.atrasados.length">
          <li v-for="e in store.atrasados" :key="e.id">
            {{ e.livro_titulo || 'Livro' }} · {{ e.tombo }} · {{ e.aluno_nome }} — {{ e.dias_atraso }} dia(s) de atraso
          </li>
        </ul>
        <span v-else class="hint">Nenhum atraso. 🎉</span>
      </div>
      <div class="aviso warn">
        <strong>🟡 Devolvem em breve ({{ store.proximos.length }})</strong>
        <ul v-if="store.proximos.length">
          <li v-for="e in store.proximos" :key="e.id">
            {{ e.livro_titulo || 'Livro' }} · {{ e.tombo }} · {{ e.aluno_nome }} — até {{ formatarData(e.data_devolucao_prevista) }}
          </li>
        </ul>
        <span v-else class="hint">Nada vencendo nos próximos 3 dias.</span>
      </div>
    </div>

    <form class="form" novalidate style="max-width:560px" @submit.prevent="salvar">
      <div class="field">
        <label for="eAluno">Aluno <span class="req">*</span></label>
        <input id="eAluno" v-model="buscaAluno" list="sug-alunos" placeholder="Digite nome ou matrícula…" />
        <datalist id="sug-alunos">
          <option v-for="a in alunosStore.alunosFiltrados" :key="a.id" :value="rotuloAluno(a)" />
        </datalist>
        <div v-if="alunoSel" class="hint">Selecionado: {{ alunoSel.nome }} ({{ alunoSel.matricula || 's/ matrícula' }})</div>
      </div>
      <div class="field">
        <label for="eBuscaLivro">Livro <span class="req">*</span></label>
        <input id="eBuscaLivro" v-model="buscaLivro" type="search" placeholder="Pesquisar por título, autor, ISBN ou tombo…" />
        <select id="eLivro" v-model="livroId" aria-label="Selecionar livro" style="margin-top:8px" @change="exemplarId = ''">
          <option value="">Selecione…</option>
          <option v-for="l in livrosFiltrados" :key="l.id" :value="l.id">{{ rotuloLivro(l) }}</option>
        </select>
        <div v-if="buscaLivro.trim()" class="hint">
          {{ livrosEncontrados.length ? `${livrosEncontrados.length} livro(s) encontrado(s) no acervo.` : 'Nenhum livro encontrado no acervo.' }}
        </div>
        <div v-if="livroSel" class="hint">Selecionado: {{ rotuloLivro(livroSel) }}</div>
        <div v-else-if="!buscaLivro.trim()" class="hint">Digite para filtrar ou escolha na lista.</div>
      </div>
      <div class="row">
        <div class="field">
          <label for="eExemplar">Exemplar (tombo) <span class="req">*</span></label>
          <select id="eExemplar" v-model="exemplarId">
            <option value="">Selecione…</option>
            <option v-for="t in tombosDisponiveis" :key="t.id" :value="t.id">{{ t.tombo }}</option>
          </select>
          <div v-if="livroSel && !tombosDisponiveis.length" class="hint">Sem exemplar disponível para este livro.</div>
        </div>
        <div class="field">
          <label for="eDias">Dias</label>
          <input id="eDias" v-model.number="dias" type="number" min="1" max="90" />
        </div>
      </div>
      <div class="btn-group">
        <button type="submit">📦 Confirmar empréstimo</button>
        <button type="button" class="btn-ghost" @click="limpar">Limpar</button>
      </div>
    </form>

    <h3 style="margin:20px 0 8px">📋 Ativos ({{ store.ativos.length }})</h3>
    <div v-if="!store.ativos.length" class="msg">Nenhum empréstimo ativo.</div>
    <ul v-else class="lista">
      <li v-for="e in store.ativos" :key="e.id" class="linha">
        <div class="linha_info">
          <strong>{{ e.livro_titulo || 'Livro' }} · {{ e.tombo }}</strong>
          <span class="hint">{{ e.aluno_nome }} — desde {{ formatarData(e.data_emprestimo) }} · devolução {{ formatarData(e.data_devolucao_prevista) }}</span>
        </div>
        <button type="button" class="btn-ghost btn-small" @click="devolver(e.id)">↩️ Devolver</button>
      </li>
    </ul>

    <details style="margin-top:16px">
      <summary>Histórico ({{ store.historico.length }})</summary>
      <ul class="lista" style="margin-top:8px">
        <li v-for="e in store.historico" :key="e.id" class="linha">
          <div class="linha_info">
            <strong>{{ e.livro_titulo || 'Livro' }} · {{ e.tombo }}</strong>
            <span class="hint">{{ e.aluno_nome }} · {{ e.status }}</span>
          </div>
        </li>
      </ul>
    </details>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEmprestimosStore } from '@/stores/emprestimos.js'
import { useAcervoStore } from '@/stores/acervo.js'
import { useAlunosStore } from '@/stores/alunos.js'
import { getDiasEmprestimoPadrao } from '@/lib/configEmprestimo.js'
import { toast, normTexto } from '@/lib/utils.js'

const store = useEmprestimosStore()
const acervo = useAcervoStore()
const alunosStore = useAlunosStore()
const route = useRoute()

const buscaAluno = ref('')
const buscaLivro = ref('')
const livroId = ref('')
const exemplarId = ref('')
const dias = ref(getDiasEmprestimoPadrao())

const livroSel = computed(() => acervo.getLivroById(livroId.value))

function rotuloLivro(livro) {
  if (!livro) return ''
  return `${livro.titulo || ''}${livro.autor ? ' — ' + livro.autor : ''}`.trim()
}

const livrosEncontrados = computed(() => {
  const termos = buscaLivro.value.trim().split(/\s+/).map(normTexto).filter(Boolean)
  if (!termos.length) return acervo.livros
  return acervo.livros.filter(l => {
    const tombos = (l.exemplaresLista || []).map(e => e.tombo || '').join(' ')
    const texto = normTexto([l.titulo, l.autor, l.editora, l.isbn, l.ano, tombos].join(' '))
    return termos.every(t => texto.includes(t))
  })
})

const livrosFiltrados = computed(() => {
  const lista = livrosEncontrados.value
  const selecionado = acervo.getLivroById(livroId.value)
  return selecionado && !lista.some(l => l.id === selecionado.id)
    ? [selecionado, ...lista]
    : lista
})

const tombosDisponiveis = computed(() => {
  const lista = livroSel.value?.exemplaresLista || []
  const ocupados = store.idsEmprestados()
  return lista.filter(t => !ocupados.has(t.id))
})

function rotuloAluno(a) {
  return `${a.nome} — ${a.matricula || 's/ matrícula'}`
}

const alunoSel = computed(() => {
  const t = buscaAluno.value.trim().toLowerCase()
  if (!t) return null
  return alunosStore.alunos.find(a =>
    a.nome.toLowerCase() === t ||
    rotuloAluno(a).toLowerCase() === t ||
    (a.matricula && a.matricula.toLowerCase() === t)) || null
})

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

onMounted(async () => {
  await Promise.all([store.carregar(), acervo.carregar(), alunosStore.carregar()])
  const selecionado = acervo.getLivroById(route.query.livro)
  if (selecionado) {
    livroId.value = selecionado.id
  }
})

function limpar() {
  buscaAluno.value = ''
  buscaLivro.value = ''
  livroId.value = ''
  exemplarId.value = ''
  dias.value = getDiasEmprestimoPadrao()
}

async function salvar() {
  try {
    const aluno = alunoSel.value
    if (!aluno) throw new Error('Escolha um aluno da lista')
    if (aluno.ativo === false) throw new Error('Aluno inativo — não pode pegar emprestado')
    if (!livroId.value) throw new Error('Escolha o livro')
    await store.criar({ exemplar_id: exemplarId.value, aluno_id: aluno.id, dias: dias.value })
    toast('Empréstimo registrado!', 'ok')
    limpar()
  } catch (err) {
    toast('Erro: ' + err.message, 'err')
  }
}

async function devolver(id) {
  if (!window.confirm('Confirmar devolução?')) return
  try {
    await store.devolver(id)
    toast('Devolvido!', 'ok')
  } catch (err) {
    toast('Erro: ' + err.message, 'err')
  }
}
</script>

<style scoped>
.avisos {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.aviso {
  flex: 1;
  min-width: 260px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.9rem;
}
.aviso.err { border-color: var(--err); }
.aviso.warn { border-color: var(--warn); }
.aviso ul {
  margin: 8px 0 0 18px;
}
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
</style>
