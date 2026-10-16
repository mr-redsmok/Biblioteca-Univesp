<template>
  <section class="view active container">
    <h2 style="margin-bottom:16px">🪪 Matrículas</h2>
    <p class="sub" style="color:var(--muted); margin-bottom:20px">Matricule novos alunos ou ajuste o cadastro.</p>

    <form class="form" @submit.prevent="salvar" novalidate style="max-width:560px">
      <div class="field">
        <label for="mNome">Nome <span class="req">*</span></label>
        <input id="mNome" v-model="form.nome" placeholder="Ex.: Maria Silva" />
      </div>
      <div class="row">
        <div class="field">
          <label for="mMatricula">Matrícula</label>
          <input id="mMatricula" v-model="form.matricula" placeholder="Ex.: 0003" />
        </div>
        <div class="field">
          <label for="mTelefone">Telefone</label>
          <input id="mTelefone" v-model="form.telefone" placeholder="Ex.: 14999998888" />
        </div>
      </div>
      <div class="field">
        <label for="mEmail">Email</label>
        <input id="mEmail" v-model="form.email" type="email" placeholder="Ex.: maria@email.com" />
      </div>
      <div class="field">
        <label for="mAtivo">Situação</label>
        <select id="mAtivo" v-model="form.ativo">
          <option :value="true">Ativo</option>
          <option :value="false">Inativo</option>
        </select>
      </div>
      <div class="btn-group">
        <button type="submit">{{ editandoId ? '💾 Salvar alterações' : '💾 Matricular aluno' }}</button>
        <button v-if="editandoId" type="button" class="btn-ghost" @click="limpar">Cancelar edição</button>
        <button v-else type="button" class="btn-ghost" @click="limpar">Limpar</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlunosStore } from '@/stores/alunos.js'
import { toast } from '@/lib/utils.js'

const store = useAlunosStore()
const route = useRoute()
const router = useRouter()
const editandoId = ref(null)

const form = reactive({ nome: '', matricula: '', email: '', telefone: '', ativo: true })

onMounted(async () => {
  await store.carregar()
  const id = route.query.editar
  if (id) {
    const a = store.getAlunoById(id)
    if (a) {
      form.nome = a.nome || ''
      form.matricula = a.matricula || ''
      form.email = a.email || ''
      form.telefone = a.telefone || ''
      form.ativo = a.ativo !== false
      editandoId.value = a.id
    }
  }
})

function limpar() {
  form.nome = ''
  form.matricula = ''
  form.email = ''
  form.telefone = ''
  form.ativo = true
  editandoId.value = null
  router.replace({ name: 'matriculas' })
}

async function salvar() {
  try {
    if (editandoId.value) {
      await store.editarAluno(editandoId.value, { ...form })
      toast('Aluno atualizado!', 'ok')
    } else {
      await store.adicionarAluno({ ...form })
      toast('Aluno matriculado!', 'ok')
    }
    limpar()
  } catch (err) {
    toast('Erro: ' + err.message, 'err')
  }
}
</script>
