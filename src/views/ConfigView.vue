<template>
  <section class="view active container">
    <h2 style="margin-bottom:16px">⚙️ Configurações do Sistema</h2>
    <p class="sub" style="color:var(--muted); margin-bottom:20px">Defina o formato do tombo dos exemplares e o prazo padrão dos empréstimos. As alterações valem para os próximos registros e não alteram tombos nem empréstimos já existentes.</p>

    <div class="config_grid">
      <form class="form" @submit.prevent="salvar">
        <h3 style="font-size:1rem; margin-bottom:12px">🔖 Tombo dos exemplares</h3>
        <div class="field">
          <label for="cfgPrefixo">Prefixo <span class="req">*</span></label>
          <input id="cfgPrefixo" v-model="cfg.prefixo" placeholder="Ex.: BIB" maxlength="10" />
          <div class="hint">Iniciais da biblioteca (ex: BIB, EMEF, UNV)</div>
        </div>
        <div class="field">
          <label for="cfgSeparador">Separador</label>
          <input id="cfgSeparador" v-model="cfg.separador" placeholder="Ex.: -" maxlength="3" />
          <div class="hint">Caractere entre prefixo e número (ex: - , / , . ) — deixe vazio para sem separador</div>
        </div>
        <div class="field">
          <label for="cfgTamanho">Tamanho da sequência <span class="req">*</span></label>
          <input id="cfgTamanho" v-model.number="cfg.tamanho" type="number" min="3" max="10" />
          <div class="hint">Número de dígitos com zero à esquerda (ex: 6 → 000001)</div>
        </div>

        <div class="field" style="background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px 16px">
          <div style="font-size:0.85rem; color:var(--muted)">Prévia do próximo tombo</div>
          <div style="font-size:1.4rem; font-weight:700; color:var(--accent); margin-top:4px">{{ preview }}</div>
          <div class="hint" style="margin-top:6px">Exemplo com sequência 1, 12, 123: {{ exemplos }}</div>
        </div>

        <div class="btn-group">
          <button type="submit">💾 Salvar tombo</button>
          <button type="button" class="btn-ghost" @click="restaurar">Restaurar padrão do tombo</button>
          <button type="button" class="btn-ghost" @click="recarregar">Recarregar</button>
        </div>
        <div v-if="erro" class="hint" style="color:var(--err); margin-top:8px">{{ erro }}</div>
        <div v-if="okMsg" class="hint" style="color:var(--ok); margin-top:8px">{{ okMsg }}</div>
      </form>

      <form class="form" @submit.prevent="salvarEmprestimo">
        <h3 style="font-size:1rem; margin-bottom:4px">📦 Tempo de empréstimo</h3>
        <p class="hint" style="line-height:1.5; margin-bottom:12px">
          Prazo padrão usado ao registrar um novo empréstimo. Empréstimos já ativos não são alterados.
        </p>
        <div class="field">
          <label for="cfgDiasEmprestimo">Prazo padrão (dias) <span class="req">*</span></label>
          <input id="cfgDiasEmprestimo" v-model.number="diasEmprestimo" type="number" :min="DIAS_EMPRESTIMO_MIN" :max="DIAS_EMPRESTIMO_MAX" />
          <div class="hint">Entre {{ DIAS_EMPRESTIMO_MIN }} e {{ DIAS_EMPRESTIMO_MAX }} dias. Pode ser ajustado em cada empréstimo.</div>
        </div>
        <div class="btn-group">
          <button type="submit">💾 Salvar tempo de empréstimo</button>
          <button type="button" class="btn-ghost" @click="restaurarEmprestimo">Restaurar padrão ({{ DIAS_EMPRESTIMO_PADRAO }} dias)</button>
        </div>
        <div v-if="erroEmprestimo" class="hint" style="color:var(--err); margin-top:8px">{{ erroEmprestimo }}</div>
        <div v-if="okEmprestimo" class="hint" style="color:var(--ok); margin-top:8px">{{ okEmprestimo }}</div>
      </form>
    </div>

    <div class="form" style="max-width:520px; margin-top:20px; background:transparent; border:none; padding:0">
      <h3 style="font-size:1rem; margin-bottom:8px">Como funciona o tombo?</h3>
      <p class="hint" style="line-height:1.5">
        O tombo identifica cada exemplar físico na prateleira. ISBN identifica a obra; tombo identifica a cópia.
        Ex: 3 cópias de “Dom Casmurro” → <code>BIB-000042</code>, <code>BIB-000043</code>, <code>BIB-000044</code>.
        A sequência é global e incremental (<code>sgbl_tombo_seq</code> no localStorage).
      </p>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { getConfigAtual, setConfig, peekUm } from '@/lib/tombo.js'
import {
  getConfigEmprestimo,
  setConfigEmprestimo,
  DIAS_EMPRESTIMO_PADRAO,
  DIAS_EMPRESTIMO_MIN,
  DIAS_EMPRESTIMO_MAX
} from '@/lib/configEmprestimo.js'
import { toast } from '@/lib/utils.js'

const cfg = reactive({ prefixo: 'BIB', separador: '-', tamanho: 6 })
const erro = ref('')
const okMsg = ref('')
const diasEmprestimo = ref(DIAS_EMPRESTIMO_PADRAO)
const erroEmprestimo = ref('')
const okEmprestimo = ref('')

function carregar() {
  const atual = getConfigAtual()
  cfg.prefixo = atual.prefixo
  cfg.separador = atual.separador
  cfg.tamanho = atual.tamanho
  diasEmprestimo.value = getConfigEmprestimo().dias
  erro.value = ''
  okMsg.value = ''
  erroEmprestimo.value = ''
  okEmprestimo.value = ''
}

onMounted(carregar)

function recarregar() { carregar(); toast('Configuração recarregada', 'ok') }

const preview = computed(() => {
  const p = (cfg.prefixo || '').trim() || 'BIB'
  const sep = cfg.separador ?? '-'
  const tam = Math.max(3, Math.min(10, Number(cfg.tamanho) || 6))
  const num = String(1).padStart(tam, '0')
  return p + sep + num
})

const exemplos = computed(() => {
  const p = (cfg.prefixo || '').trim() || 'BIB'
  const sep = cfg.separador ?? '-'
  const tam = Math.max(3, Math.min(10, Number(cfg.tamanho) || 6))
  return [1,12,123].map(n=> p+sep+String(n).padStart(tam,'0')).join(', ')
})

function validar() {
  if (!cfg.prefixo || !cfg.prefixo.trim()) return 'Prefixo é obrigatório'
  if (cfg.prefixo.trim().length > 10) return 'Prefixo deve ter até 10 caracteres'
  if (cfg.separador && cfg.separador.length > 3) return 'Separador deve ter até 3 caracteres'
  const tam = Number(cfg.tamanho)
  if (!Number.isInteger(tam) || tam < 3 || tam > 10) return 'Tamanho deve ser um inteiro entre 3 e 10'
  return null
}

function salvar() {
  erro.value = ''
  okMsg.value = ''
  const msg = validar()
  if (msg) { erro.value = msg; toast(msg, 'err'); return }
  const novo = { prefixo: cfg.prefixo.trim(), separador: cfg.separador ?? '', tamanho: Number(cfg.tamanho) }
  try {
    setConfig(novo)
    okMsg.value = `Configuração salva! Próximo tombo: ${peekUm()}`
    toast('Configuração do tombo salva!', 'ok')
  } catch (e) {
    erro.value = e.message
    toast('Falha ao salvar: ' + e.message, 'err')
  }
}

function salvarEmprestimo() {
  erroEmprestimo.value = ''
  okEmprestimo.value = ''
  const dias = Number(diasEmprestimo.value)
  if (!Number.isInteger(dias) || dias < DIAS_EMPRESTIMO_MIN || dias > DIAS_EMPRESTIMO_MAX) {
    const msg = `Prazo deve ser um inteiro entre ${DIAS_EMPRESTIMO_MIN} e ${DIAS_EMPRESTIMO_MAX} dias`
    erroEmprestimo.value = msg
    toast(msg, 'err')
    return
  }
  try {
    setConfigEmprestimo({ dias })
    okEmprestimo.value = `Prazo padrão salvo: ${dias} dia(s).`
    toast('Tempo de empréstimo salvo!', 'ok')
  } catch (e) {
    erroEmprestimo.value = e.message
    toast('Falha ao salvar: ' + e.message, 'err')
  }
}

function restaurarEmprestimo() {
  diasEmprestimo.value = DIAS_EMPRESTIMO_PADRAO
  salvarEmprestimo()
}

function restaurar() {
  cfg.prefixo = 'BIB'
  cfg.separador = '-'
  cfg.tamanho = 6
  salvar()
}
</script>

<style scoped>
.config_grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
  max-width: 1080px;
}

.config_grid .form {
  width: 100%;
  max-width: none;
  margin: 0;
}

@media (max-width: 820px) {
  .config_grid {
    grid-template-columns: 1fr;
  }
}
</style>
