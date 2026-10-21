/* ================= CONFIGURAÇÃO DE EMPRÉSTIMOS ================= */
const CONFIG_KEY = 'sgbl_emprestimo_config'

export const DIAS_EMPRESTIMO_PADRAO = 14
export const DIAS_EMPRESTIMO_MIN = 1
export const DIAS_EMPRESTIMO_MAX = 90

function diasValidos(valor) {
  const n = Number(valor)
  return Number.isInteger(n) && n >= DIAS_EMPRESTIMO_MIN && n <= DIAS_EMPRESTIMO_MAX
}

/** Lê a configuração atual, com fallback seguro para o padrão. */
export function getConfigEmprestimo() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (diasValidos(parsed?.dias)) return { dias: Number(parsed.dias) }
    }
  } catch { /* ignora configuração inválida */ }
  return { dias: DIAS_EMPRESTIMO_PADRAO }
}

/** Retorna apenas o prazo padrão em dias. */
export function getDiasEmprestimoPadrao() {
  return getConfigEmprestimo().dias
}

/** Salva o prazo padrão. Lança erro se o valor não for um inteiro válido. */
export function setConfigEmprestimo(cfg) {
  const dias = Number(cfg?.dias)
  if (!diasValidos(dias)) {
    throw new Error(`Tempo de empréstimo deve ser um inteiro entre ${DIAS_EMPRESTIMO_MIN} e ${DIAS_EMPRESTIMO_MAX} dias`)
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ dias }))
  return { dias }
}
