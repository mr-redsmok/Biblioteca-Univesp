<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <h1>📚<span> Biblioteca</span></h1>
        <p class="brand_sub">Sistema de Gestão</p>
      </div>
      <nav class="side_nav" aria-label="Menu principal">
        <div class="side_group">
          <button type="button" class="side_group_btn" :class="{ active: grupoAtivo==='catalogo' }" @click="alternar('catalogo')">
            <span>📖 Catálogo</span><span class="seta" :class="{ aberta: aberto.catalogo }">▸</span>
          </button>
          <div v-show="aberto.catalogo" class="gaveta">
            <router-link to="/catalogo" class="side_link" :class="{ active: $route.name==='catalogo' }">📚 Acervo</router-link>
            <router-link to="/cadastrar" class="side_link" :class="{ active: $route.name==='cadastrar' || $route.name==='editar' }">➕ Cadastrar</router-link>
            <router-link to="/buscar" class="side_link" :class="{ active: $route.name==='buscar' }">🔎 Buscar livro</router-link>
          </div>
        </div>
        <div class="side_group">
          <button type="button" class="side_group_btn" :class="{ active: grupoAtivo==='alunos' }" @click="alternar('alunos')">
            <span>🎓 Alunos</span><span class="seta" :class="{ aberta: aberto.alunos }">▸</span>
          </button>
          <div v-show="aberto.alunos" class="gaveta">
            <router-link to="/alunos" class="side_link" :class="{ active: $route.name==='alunos' }">👥 Alunos</router-link>
            <router-link to="/matriculas" class="side_link" :class="{ active: $route.name==='matriculas' }">🪪 Matrículas</router-link>
          </div>
        </div>
        <router-link to="/configuracoes" class="side_group_btn solo" :class="{ active: $route.name==='configuracoes' }">⚙️ Tombo</router-link>
      </nav>
    </aside>

    <div class="content">
      <main class="main">
        <router-view />
      </main>

      <footer class="container footer">
        <p class="footer_text">&copy; 2026 Sistema de Gestão de Biblioteca. Todos direitos reservados.</p>
      </footer>
    </div>
  </div>

  <AppToast />

  <!-- Modal global -->
  <ConfirmModal
    :show="modal.show"
    :titulo="modal.titulo"
    :texto="modal.texto"
    @confirm="confirmarModal"
    @cancel="modal.show = false"
  />
</template>

<script setup>
import { onMounted, provide, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAcervoStore } from '@/stores/acervo.js'
import { toast } from '@/lib/utils.js'
import ConfirmModal from '@/components/ConfirmModal.vue'
import AppToast from '@/components/AppToast.vue'
import { useConfirmModal } from '@/composables/useConfirmModal.js'

const acervo = useAcervoStore()
const route = useRoute()
const { modal, abrir: abrirModalExcluir, fechar } = useConfirmModal()

const aberto = reactive({ catalogo: true, alunos: false })

const grupoDaRota = (nome) => {
  if (['catalogo', 'cadastrar', 'editar', 'buscar'].includes(nome)) return 'catalogo'
  if (['alunos', 'matriculas'].includes(nome)) return 'alunos'
  return null
}

const grupoAtivo = computed(() => grupoDaRota(route.name))

function alternar(grupo) {
  aberto[grupo] = !aberto[grupo]
}

watch(() => route.name, (nome) => {
  const g = grupoDaRota(nome)
  if (g) aberto[g] = true
}, { immediate: true })

onMounted(() => {
  acervo.carregar()
})

async function confirmarModal() {
  if (modal.id) {
    try {
      await acervo.excluirLivro(modal.id)
      toast('Livro excluído', 'ok')
    } catch (e) {
      toast('Erro: ' + e.message, 'err')
    }
  }
  fechar()
}

provide('modalExcluir', abrirModalExcluir)
</script>

<style>
/* importa css legado */
@import "../css/base.css";
@import "../css/header.css";
@import "../css/buttons.css";
@import "../css/form.css";
@import "../css/cards.css";
@import "../css/catalog.css";
@import "../css/search.css";
@import "../css/modal.css";
@import "../css/toast.css";
@import "../css/footer.css";

/* ajustes Vue router-link */
.tabs .tab {
  text-decoration: none;
}
.tabs .tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* ---------- painel lateral com gavetas ---------- */
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 248px;
  flex-shrink: 0;
  background: var(--card);
  border-right: 1px solid var(--border);
  padding: 24px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.brand h1 {
  font-size: 1.35rem;
  margin-bottom: 2px;
  padding: 0 6px;
}
.brand_sub {
  color: var(--muted);
  font-size: 0.85rem;
  padding: 0 6px;
}
.side_nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.side_group_btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
}
.side_group_btn:hover {
  color: var(--text);
  background: rgba(122, 162, 255, 0.08);
}
.side_group_btn.active {
  color: var(--accent);
}
.side_group_btn .seta {
  transition: transform 0.2s;
  font-size: 0.85rem;
}
.side_group_btn .seta.aberta {
  transform: rotate(90deg);
}
.gaveta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 2px 0 6px 12px;
  padding-left: 10px;
  border-left: 1px solid var(--border);
}
.side_link {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 9px 12px;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}
.side_link:hover {
  color: var(--text);
  background: rgba(122, 162, 255, 0.08);
}
.side_link.active {
  color: var(--accent);
  background: rgba(122, 162, 255, 0.12);
}
.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.content .container {
  padding-left: 24px;
  padding-right: 24px;
}
@media (max-width: 720px) {
  .layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    padding: 12px 14px;
    gap: 8px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .brand_sub {
    display: none;
  }
}
.main {
  flex: 1;
  padding-bottom: 20px;
}
.view {
  display: block !important;
}
</style>
