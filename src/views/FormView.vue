<template>
  <section class="view active container">
    <form class="form" @submit.prevent="salvar" novalidate>
      <div class="field">
        <label for="fTitulo"> Título<span class="req"> *</span></label>
        <input id="fTitulo" v-model="form.titulo" list="sug-titulo" />
        <datalist id="sug-titulo">
          <option v-for="v in acervo.sugestoes.titulo" :key="v" :value="v" />
        </datalist>
        <div class="hint">Digite o título e clique em “⚡ Auto preencher” ou busque pelo ISBN para dados automáticos.</div>
      </div>

      <div class="row">
        <div class="field">
          <label for="fAutor">Autor</label>
          <input id="fAutor" v-model="form.autor" list="sug-autor" />
          <datalist id="sug-autor">
            <option v-for="v in acervo.sugestoes.autor" :key="v" :value="v" />
          </datalist>
        </div>
        <div class="field">
          <label for="fEditora">Editora</label>
          <input id="fEditora" v-model="form.editora" list="sug-editora" />
          <datalist id="sug-editora">
            <option v-for="v in acervo.sugestoes.editora" :key="v" :value="v" />
          </datalist>
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="fIsbn">ISBN</label>
          <input id="fIsbn" v-model="form.isbn" placeholder="Ex.: 9788535902778" list="sug-isbn" :class="{ err: avisoIsbnDuplicado }" />
          <datalist id="sug-isbn">
            <option v-for="v in acervo.sugestoes.isbn" :key="v" :value="v" />
          </datalist>
          <div v-if="avisoIsbnDuplicado" class="hint" style="color:var(--err)">⚠️ ISBN já cadastrado em “{{ avisoIsbnDuplicado.titulo }}” (tombo: {{ (avisoIsbnDuplicado.exemplaresLista||[]).map(e=>e.tombo).join(', ') || '—' }})</div>
          <div v-else-if="isbnNormalizado && form.isbn.trim()" class="hint" style="color:var(--ok)">✓ ISBN disponível</div>
        </div>
        <div class="field">
          <label for="fAno">Ano de publicação</label>
          <input id="fAno" v-model="form.ano" type="number" min="0" max="2100" placeholder="Ex.: 1999" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="fPaginas">Páginas</label>
          <input id="fPaginas" v-model="form.paginas" type="number" min="1" placeholder="Ex.: 256" />
        </div>
        <div class="field">
          <label for="fExemplares">Nº de exemplares</label>
          <input id="fExemplares" v-model.number="form.exemplares" type="number" min="1" />
          <div class="hint" id="hintTombos">{{ hintTombos }}</div>
        </div>
      </div>

      <div class="field">
        <label for="fCapa">URL da capa</label>
        <input id="fCapa" v-model="form.capa" type="url" placeholder="https://…" />
      </div>
      <div class="field">
        <label for="fDesc">Descrição</label>
        <textarea id="fDesc" v-model="form.descricao" placeholder="Resumo / sinopse…"></textarea>
      </div>
      <div class="field">
        <label for="fEstadoLivro">Estado do livro<span class="req"> *</span></label>
        <select id="fEstadoLivro" v-model="form.estadoLivro">
          <option value="">Selecione...</option>
          <option value="novo">Novo</option>
          <option value="usado">Usado</option>
        </select>
      </div>
      <div class="field">
        <label for="fMetodoAquisicao">Método de aquisição<span class="req"> *</span></label>
        <select id="fMetodoAquisicao" v-model="form.metodoAquisicao">
          <option value="">Selecione...</option>
          <option value="compra">Compra</option>
          <option value="doacao">Doação</option>
        </select>
      </div>

      <div class="btn-group">
        <button type="button" class="btn-ghost" @click="autoPreencher" :disabled="autofillLoading">
          {{ autofillLoading ? '⏳ Buscando…' : '⚡ Auto preencher' }}
        </button>
        <button type="submit">{{ editando ? '💾 Salvar alterações' : '💾 Salvar livro' }}</button>
        <button type="button" class="btn-ghost" @click="limpar">Limpar</button>
        <span class="spacer"></span>
        <router-link v-if="editando" to="/catalogo" class="btn-ghost" style="text-decoration:none; align-self:center"> Cancelar edição </router-link>
      </div>
      <div v-if="autofillError" class="hint" style="color:var(--err); margin-top:8px">{{ autofillError }}</div>
    </form>
  </section>
</template>

<script setup>
import { useLivroForm } from '@/composables/useLivroForm.js'

const {
  form, acervo, editando,
  hintTombos, isbnNormalizado, avisoIsbnDuplicado,
  autofillLoading, autofillError,
  autoPreencher, salvar, limpar
} = useLivroForm()
</script>

<style scoped>
.field input.err, .field select.err { border-color: var(--err); }
</style>
