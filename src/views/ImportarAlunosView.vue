<template>
  <section class="view active container">
    <div style="margin-bottom:12px">
      <button type="button" class="btn-ghost btn-small" @click="router.push({ name: 'matriculas' })">← Voltar para Matrículas</button>
    </div>
    <h2 style="margin-bottom:16px">📥 Importar alunos</h2>
    <p class="sub" style="color:var(--muted); margin-bottom:20px">
      Envie um arquivo por turma. O arquivo é lido no navegador; nada é gravado antes da confirmação.
    </p>

    <div class="card-box">
      <div class="row">
        <div class="field">
          <label for="iAno">Ano letivo <span class="req">*</span></label>
          <input id="iAno" v-model.number="anoLetivo" type="number" min="2000" max="2100" />
        </div>
        <div class="field">
          <label for="iArquivos">Arquivos de alunos</label>
          <input id="iArquivos" type="file" accept=".csv,text/csv" multiple @change="selecionarArquivos" />
          <div class="hint">Um arquivo por turma.</div>
        </div>
      </div>

      <div v-if="arquivos.length" class="lista">
        <div v-for="(arq, idx) in arquivos" :key="arq.key" class="linha">
          <div class="linha_info">
            <strong>{{ arq.nome }}</strong>
            <span class="hint">
              {{ arq.alunos.length }} aluno(s)
              <span v-if="arq.anoLetivo"> · ano no arquivo: {{ arq.anoLetivo }}</span>
              <span v-if="arq.erros.length" class="erro"> · {{ arq.erros.length }} erro(s)</span>
            </span>
          </div>
          <div class="field campo-turma">
            <label :for="'turma-' + idx">Turma <span class="req">*</span></label>
            <select :id="'turma-' + idx" v-model="arq.turma">
              <option value="">Selecione…</option>
              <option v-for="t in turmas" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <button type="button" class="btn-ghost btn-small" @click="removerArquivo(idx)">🗑️</button>
        </div>
      </div>

      <div class="btn-group">
        <button type="button" :disabled="!arquivos.length || !anoLetivo" @click="gerarPrevia">🔎 Gerar prévia</button>
        <button type="button" class="btn-ghost" @click="limpar">Limpar</button>
      </div>
    </div>

    <div v-if="plano" class="preview">
      <h3>Prévia da importação</h3>
      <p class="hint">Nada foi gravado ainda. Confira os números e marque quem deve ser inativado.</p>

      <div class="resumo">
        <div class="resumo_item"><strong>{{ plano.novos.length }}</strong><span>novos</span></div>
        <div class="resumo_item"><strong>{{ plano.atualizados.length }}</strong><span>atualizados</span></div>
        <div class="resumo_item"><strong>{{ plano.semMudanca.length }}</strong><span>sem mudança</span></div>
        <div class="resumo_item"><strong>{{ plano.inativarAgora.length }}</strong><span>inativar agora</span></div>
        <div class="resumo_item"><strong>{{ plano.possiveisSaidas.length }}</strong><span>possíveis saídas</span></div>
        <div class="resumo_item"><strong>{{ plano.erros.length }}</strong><span>erros</span></div>
      </div>

      <div v-if="plano.avisos.length" class="aviso warn">
        <strong>⚠️ Avisos</strong>
        <ul>
          <li v-for="(a, i) in plano.avisos" :key="i">
            {{ a.motivo }} <span v-if="a.arquivo" class="hint">({{ a.arquivo }})</span>
          </li>
        </ul>
      </div>

      <details v-if="plano.erros.length" open>
        <summary>❌ Erros ({{ plano.erros.length }})</summary>
        <ul>
          <li v-for="(e, i) in plano.erros" :key="i">
            <span v-if="e.linha">Linha {{ e.linha }}: </span>{{ e.motivo }}
            <span v-if="e.arquivo" class="hint"> — {{ e.arquivo }}</span>
          </li>
        </ul>
        <p class="hint">As linhas com erro serão ignoradas; o restante pode ser importado.</p>
      </details>

      <details v-if="plano.novos.length">
        <summary>🆕 Novos ({{ plano.novos.length }})</summary>
        <ul>
          <li v-for="a in plano.novos" :key="a.matricula">
            {{ a.nome }} · {{ a.matricula }}
            <span class="hint">— {{ a.turma }} · {{ a.anoLetivo }}</span>
          </li>
        </ul>
      </details>

      <details v-if="plano.atualizados.length">
        <summary>✏️ Atualizados ({{ plano.atualizados.length }})</summary>
        <ul>
          <li v-for="a in plano.atualizados" :key="a.matricula">
            <strong>{{ a.nome }}</strong> · {{ a.matricula }}
            <ul class="detalhes">
              <li v-for="m in a.mudancas" :key="m.campo">
                {{ rotuloCampo(m.campo) }}: {{ valorMudanca(m) }}
              </li>
            </ul>
          </li>
        </ul>
      </details>

      <details v-if="plano.semMudanca.length">
        <summary>✅ Sem mudança ({{ plano.semMudanca.length }})</summary>
        <ul>
          <li v-for="a in plano.semMudanca" :key="a.matricula">{{ a.nome }} · {{ a.matricula }}</li>
        </ul>
      </details>

      <details v-if="plano.inativarAgora.length" open>
        <summary>⛔ Inativar agora ({{ plano.inativarAgora.length }})</summary>
        <p class="hint">Inclui alunos novos que já vêm como Transferido/Baixa; eles serão criados já inativos.</p>
        <ul>
          <li v-for="a in plano.inativarAgora" :key="a.matricula">
            {{ a.nome }} · {{ a.matricula }}
            <span class="hint">— situação no arquivo: {{ a.situacao }}</span>
          </li>
        </ul>
      </details>

      <details v-if="plano.possiveisSaidas.length" open>
        <summary>⚠️ Possíveis saídas ({{ plano.possiveisSaidas.length }}) — marque quem deve ser inativado</summary>
        <p class="hint">São alunos ativos que não apareceram em nenhum dos arquivos desta importação. Começam desmarcados.</p>
        <ul class="check-list">
          <li v-for="a in plano.possiveisSaidas" :key="a.id || a.matricula">
            <label>
              <input v-model="inativarSelecionados" type="checkbox" :value="a.matricula" />
              {{ a.nome }} · {{ a.matricula }}
              <span v-if="a.turma" class="hint">— {{ a.turma }}</span>
            </label>
          </li>
        </ul>
      </details>

      <div class="btn-group">
        <button type="button" :disabled="aplicando" @click="confirmar">
          {{ aplicando ? '⏳ Importando…' : '✅ Confirmar importação' }}
        </button>
        <button type="button" class="btn-ghost" :disabled="aplicando" @click="plano = null">Voltar</button>
      </div>
    </div>

    <ConfirmModal
      :show="modalAberto"
      titulo="Confirmar importação"
      :texto="textoConfirmacao"
      confirm-label="Importar"
      cancel-label="Cancelar"
      @confirm="aplicar"
      @cancel="modalAberto = false"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { parseSedCsv } from '@/lib/sedCsv.js'
import { planejarImportacao } from '@/lib/importAlunos.js'
import { useAlunosStore } from '@/stores/alunos.js'
import { TURMAS } from '@/lib/turmas.js'
import { newId, toast } from '@/lib/utils.js'

const router = useRouter()
const store = useAlunosStore()
const turmas = computed(() => {
  const set = new Set([...TURMAS, ...store.turmasDisponiveis])
  return [...set].sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }))
})
const anoLetivo = ref(new Date().getFullYear())
const arquivos = ref([])
const plano = ref(null)
const inativarSelecionados = ref([])
const modalAberto = ref(false)
const aplicando = ref(false)

onMounted(() => store.carregar())

async function selecionarArquivos(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseSedCsv(buffer)
      arquivos.value.push({
        key: newId(),
        nome: file.name,
        alunos: parsed.alunos,
        anoLetivo: parsed.anoLetivo,
        erros: parsed.erros,
        turma: ''
      })
      if (parsed.erros.length) {
        toast(`${file.name}: ${parsed.erros.length} linha(s) com erro`, 'err')
      }
    } catch (e) {
      toast(`Erro ao ler ${file.name}: ${e.message}`, 'err')
    }
  }

  plano.value = null
}

function removerArquivo(idx) {
  arquivos.value.splice(idx, 1)
  plano.value = null
}

async function gerarPrevia() {
  if (!anoLetivo.value) {
    toast('Informe o ano letivo', 'err')
    return
  }
  if (!arquivos.value.length) {
    toast('Selecione ao menos um arquivo', 'err')
    return
  }
  if (arquivos.value.some(a => !a.turma)) {
    toast('Escolha a turma de cada arquivo', 'err')
    return
  }

  await store.carregar()

  plano.value = planejarImportacao(
    store.alunos,
    arquivos.value.map(a => ({
      turma: a.turma,
      anoLetivo: Number(anoLetivo.value),
      anoLetivoArquivo: a.anoLetivo,
      arquivo: a.nome,
      alunos: a.alunos,
      erros: a.erros
    })),
    Number(anoLetivo.value)
  )
  inativarSelecionados.value = []
}

const textoConfirmacao = computed(() => {
  if (!plano.value) return ''
  const p = plano.value
  const saidas = inativarSelecionados.value.length
  const erros = p.erros.length ? ` ${p.erros.length} linha(s) com erro serão ignoradas.` : ''
  return `Importar ${p.novos.length} novo(s), atualizar ${p.atualizados.length}, ` +
    `inativar ${p.inativarAgora.length} agora` +
    (saidas ? ` e inativar ${saidas} possível(is) saída(s)` : '') +
    `.${erros} Nenhum aluno será excluído.`
})

function confirmar() {
  if (!plano.value) return
  const p = plano.value
  const temAlgo = p.novos.length || p.atualizados.length || p.semMudanca.length ||
    p.inativarAgora.length || inativarSelecionados.value.length
  if (!temAlgo) {
    toast('Nada para importar', 'err')
    return
  }
  modalAberto.value = true
}

async function aplicar() {
  modalAberto.value = false
  aplicando.value = true
  try {
    const resultado = await store.aplicarImportacao(plano.value, {
      inativar: inativarSelecionados.value
    })
    toast(`${resultado.gravados} aluno(s) importado(s) com sucesso!`, 'ok')
    limpar()
    router.push({ name: 'alunos' })
  } catch (e) {
    const parcial = e.gravados != null ? ` (${e.gravados} de ${e.total} gravados)` : ''
    toast('Erro na importação' + parcial + ': ' + e.message, 'err')
  } finally {
    aplicando.value = false
  }
}

function limpar() {
  arquivos.value = []
  plano.value = null
  inativarSelecionados.value = []
  modalAberto.value = false
}

function rotuloCampo(campo) {
  return campo === 'anoLetivo' ? 'ano letivo' : campo
}

function valorMudanca(m) {
  return `${m.de ?? '—'} → ${m.para ?? '—'}`
}
</script>

<style scoped>
.card-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}
.linha {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
}
.linha_info {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.campo-turma {
  margin: 0;
  min-width: 160px;
}
.erro {
  color: var(--err);
}
.preview {
  margin-top: 8px;
}
.resumo {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 14px 0;
}
.resumo_item {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 120px;
  display: flex;
  flex-direction: column;
}
.resumo_item strong {
  font-size: 1.4rem;
}
.resumo_item span {
  color: var(--muted);
  font-size: 0.85rem;
}
.preview details {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  margin-top: 8px;
}
.preview summary {
  cursor: pointer;
  font-weight: 600;
}
.preview ul {
  margin: 8px 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.preview .detalhes {
  margin: 4px 0 4px 18px;
  color: var(--muted);
  font-size: 0.85rem;
}
.aviso {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  margin-top: 8px;
  background: var(--card);
  font-size: 0.9rem;
}
.aviso.warn {
  border-color: var(--warn);
}
.check-list {
  list-style: none;
  margin-left: 0 !important;
}
.check-list label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}
</style>
