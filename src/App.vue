<template>
  <header class="header">
    <div class="container">
      <h1>📚<span> Biblioteca</span> — Sistema de Gestão</h1>
      <nav class="tabs" role="tablist">
        <router-link to="/catalogo" class="tab" :class="{ active: $route.name==='catalogo' }" role="tab">📖 Catálogo</router-link>
        <router-link to="/cadastrar" class="tab" :class="{ active: $route.name==='cadastrar' || $route.name==='editar' }" role="tab">➕ Cadastrar</router-link>
        <router-link to="/buscar" class="tab" :class="{ active: $route.name==='buscar' }" role="tab">🔎 Buscar livro</router-link>
        <router-link to="/configuracoes" class="tab" :class="{ active: $route.name==='configuracoes' }" role="tab">⚙️ Tombo</router-link>
      </nav>
    </div>
  </header>

  <main class="main">
    <router-view />
  </main>

  <AppToast />
  <footer class="container footer">
    <p class="footer_text">&copy; 2026 Sistema de Gestão de Biblioteca. Todos direitos reservados.</p>
  </footer>

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
import { provide } from 'vue'
import { useAcervoStore } from '@/stores/acervo.js'
import { toast } from '@/lib/utils.js'
import ConfirmModal from '@/components/ConfirmModal.vue'
import AppToast from '@/components/AppToast.vue'
import { useConfirmModal } from '@/composables/useConfirmModal.js'

const acervo = useAcervoStore()
const { modal, abrir: abrirModalExcluir, fechar } = useConfirmModal()

function confirmarModal() {
  if (modal.id) {
    try {
      acervo.excluirLivro(modal.id)
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
.main {
  flex: 1;
  padding-bottom: 20px;
}
.view {
  display: block !important;
}
</style>
