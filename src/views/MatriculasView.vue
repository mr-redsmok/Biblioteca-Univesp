<template>
  <section class="view active container">
    <h2 style="margin-bottom:16px">🪪 Matrículas</h2>
    <p class="sub" style="color:var(--muted); margin-bottom:20px">Matricule novos alunos ou ajuste o cadastro.</p>

    <div class="toolbar" style="margin-bottom:16px">
      <button type="button" class="btn-ghost" @click="irParaImportacao">📥 Importar alunos</button>
    </div>

    <form class="form" novalidate style="max-width:560px" @submit.prevent="salvar">
      <div class="field">
        <label for="mNome">Nome <span class="req">*</span></label>
        <input id="mNome" v-model="form.nome" placeholder="Ex.: Maria Silva" />
      </div>
      <div class="row">
        <div class="field">
          <label for="mMatricula">Matrícula</label>
          <input id="mMatricula" v-model="form.matricula" placeholder="Ex.: 000012345-0" />
          <div class="hint">Formato: RA-Dígito (ex.: 000012345-X).</div>
        </div>
        <div class="field">
          <label for="mTelefone">Telefone</label>
          <input id="mTelefone" v-model="form.telefone" placeholder="Ex.: 14999998888" />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label for="mTurma">Turma</label>
          <select id="mTurma" v-model="form.turma">
            <option value="">—</option>
            <option v-for="t in turmasOpcoes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="field">
          <label for="mAnoLetivo">Ano letivo</label>
          <input id="mAnoLetivo" v-model.number="form.anoLetivo" type="number" min="2000" max="2100" placeholder="Ex.: 2026" />
        </div>
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
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlunosStore } from '@/stores/alunos.js'
import { TURMAS } from '@/lib/turmas.js'
import { toast } from '@/lib/utils.js'

const store = useAlunosStore()
const route = useRoute()
const router = useRouter()
const editandoId = ref(null)

const form = reactive({ nome: '', matricula: '', telefone: '', turma: '', anoLetivo: null, ativo: true })

const turmasOpcoes = computed(() => {
  const set = new Set([...TURMAS, ...store.turmasDisponiveis])
  return [...set].sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }))
})

function irParaImportacao() {
  router.push({ name: 'alunos-importar' })
}

onMounted(async () => {
  await store.carregar()
  const id = route.query.editar
  if (id) {
    const a = store.getAlunoById(id)
    if (a) {
      form.nome = a.nome || ''
      form.matricula = a.matricula || ''
      form.telefone = a.telefone || ''
      form.turma = a.turma || ''
      form.anoLetivo = a.anoLetivo ?? null
      form.ativo = a.ativo !== false
      editandoId.value = a.id
    }
  }
})

function limpar() {
  form.nome = ''
  form.matricula = ''
  form.telefone = ''
  form.turma = ''
  form.anoLetivo = null
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
