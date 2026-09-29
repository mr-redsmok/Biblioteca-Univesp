/* ================= TOMBO — Geração Automática ================= */
const SEQ_KEY = 'sgbl_tombo_seq'
const CONFIG_KEY = 'sgbl_tombo_config'

function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignora */ }
  return { prefixo: 'BIB', separador: '-', tamanho: 6 }
}

export function setConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

function getSeq() {
  return Number(localStorage.getItem(SEQ_KEY)) || 0
}

function setSeq(n) {
  localStorage.setItem(SEQ_KEY, String(n))
}

function formatarTombo(seq, cfg) {
  const num = String(seq).padStart(cfg.tamanho, '0')
  return cfg.prefixo + cfg.separador + num
}

/** Gera um único tombo e incrementa a sequência (side-effect). */
export function gerarTombo() {
  const cfg = getConfig()
  const seq = getSeq() + 1
  setSeq(seq)
  return formatarTombo(seq, cfg)
}

/** Retorna N tombos sem incrementar a sequência (prévia). */
export function peekProximoTombo(qtd) {
  const cfg = getConfig()
  const atual = getSeq()
  const lista = []
  for (let i = 1; i <= qtd; i++) {
    lista.push(formatarTombo(atual + i, cfg))
  }
  return lista
}

/** Retorna o próximo tombo que seria gerado (sem consumir). */
export function peekUm() {
  const cfg = getConfig()
  return formatarTombo(getSeq() + 1, cfg)
}

/** Reseta a sequência (uso administrativo). */
export function resetSeq(n = 0) {
  setSeq(n)
}

/** Lê a config atual. */
export function getConfigAtual() {
  return getConfig()
}
