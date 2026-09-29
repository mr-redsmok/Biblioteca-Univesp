/* ================= AUTO PREENCHER (via API) ================= */
import { normIsbn } from './utils.js'

export function escolherMelhorResultado(livrosApi, titulo, autor, isbn) {
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  const alvo = norm(titulo)
  const alvoAutor = norm(autor)
  const alvoIsbn = isbn ? normIsbn(isbn) : ''
  if (alvoIsbn) {
    const exato = livrosApi.find((l) => normIsbn(l.isbn) === alvoIsbn)
    if (exato) return exato
  }
  if (!alvo) {
    const completude = (l) => [l.titulo, l.autor, l.editora, l.isbn, l.ano, l.paginas, l.capa, l.descricao]
      .filter((x) => x && String(x).trim()).length
    const pt = (l) => (l.idioma === 'pt' || l.idioma === 'por') ? 1 : 0
    return livrosApi.slice().sort((a, b) => (pt(b) - pt(a)) || (completude(b) - completude(a)))[0]
  }

  const freq = {}
  for (const l of livrosApi) {
    const a = norm(l.autor)
    if (a) freq[a] = (freq[a] || 0) + 1
  }
  let maxFreq = 0
  for (const k in freq) maxFreq = Math.max(maxFreq, freq[k])
  const autorDominante = maxFreq > 1 ? Object.keys(freq).find(k => freq[k] === maxFreq) : null

  const bateAutor = (l) => {
    const na = norm(l.autor)
    if (!na) return false
    if (na === alvoAutor) return true
    return alvoAutor.length > 2 && (na.includes(alvoAutor) || alvoAutor.includes(na))
  }

  let melhor = null
  let melhorPts = -1
  let debug = []
  for (const l of livrosApi) {
    const nt = norm(l.titulo)
    let pts = 0
    const motivos = []
    if (nt === alvo) { pts += 5; motivos.push('titulo exato +5') }
    else if (nt.includes(alvo) || alvo.includes(nt)) { pts += 3; motivos.push('titulo parcial +3') }
    if (autorDominante && norm(l.autor) === autorDominante) { pts += 4; motivos.push('autor dominante +4') }
    if (alvoAutor && bateAutor(l)) { pts += 5; motivos.push('autor bate +5') }
    if (l.autor) { pts += 1; motivos.push('tem autor +1') }
    if (l.ano) { pts += 1; motivos.push('tem ano +1') }
    if (l.capa) { pts += 1; motivos.push('tem capa +1') }
    if (l.isbn) { pts += 1; motivos.push('tem isbn +1') }
    const idi = String(l.idioma || '').toLowerCase()
    if (idi === 'por' || idi.startsWith('pt')) { pts += 100; motivos.push('idioma pt +100') }
    else if (idi) { pts -= 40; motivos.push('idioma estrang -40') }
    if (l.descricao) { pts += 2; motivos.push('tem descricao +2') }
    pts += Math.min(l.edition_count || 0, 100) / 20
    if (pts > melhorPts) { melhorPts = pts; melhor = l; debug = motivos }
  }
  if (import.meta.env.DEV && melhor) {
    console.debug('[autofill] escolhido:', melhor.titulo, 'pts', melhorPts, debug)
  }
  if (melhorPts <= 0) return null
  const nt = norm(melhor.titulo)
  const temMatchTitulo = (nt === alvo) || nt.includes(alvo) || alvo.includes(nt)
  if (temMatchTitulo) return melhor
  const muitasEdicoes = (melhor.edition_count || 0) >= 10
  if (melhor.autor && muitasEdicoes) return melhor
  return null
}

export function enriquecerLivro(livroBase, todosLivros) {
  // Preenche campos vazios do livroBase com dados de outros resultados (prioriza livroBase)
  if (!livroBase || !todosLivros?.length) return livroBase
  const campos = ['titulo','autor','editora','isbn','ano','paginas','capa','descricao']
  const merged = { ...livroBase }
  for (const campo of campos) {
    if (!merged[campo] || !String(merged[campo]).trim()) {
      const candidato = todosLivros.find(l=> l!==livroBase && l[campo] && String(l[campo]).trim())
      if (candidato) merged[campo] = candidato[campo]
    }
  }
  // idioma: prioriza pt
  if (!merged.idioma || merged.idioma!=='por') {
    const pt = todosLivros.find(l=> l.idioma==='por' || l.idioma==='pt')
    if (pt) merged.idioma = pt.idioma
  }
  return merged
}

export function aplicarAutopreenchimento(livro, formValues) {
  // Versão Vue: recebe objeto reativo do form, retorna quantos campos preencheria e o patch
  // Agora preenche mesmo que campo já tenha valor? Não — só vazios, mas se livroBase foi enriquecido, já tem todos
  const patch = {}
  const campos = {
    titulo: livro.titulo,
    autor: livro.autor,
    editora: livro.editora,
    isbn: livro.isbn,
    ano: livro.ano,
    paginas: livro.paginas,
    capa: livro.capa,
    descricao: livro.descricao
  }
  let preenchidos = 0
  for (const [campo, valor] of Object.entries(campos)) {
    if (valor && !String(formValues[campo] || '').trim()) {
      patch[campo] = String(valor).trim()
      preenchidos++
    }
  }
  return { preenchidos, patch }
}

// Nova: aplica com enriquecimento e força sobrescrita opcional para campos ainda vazios
export function aplicarAutopreenchimentoEnriquecido(livroBase, todosLivros, formValues, { forcarVazios=true }={}) {
  const livro = enriquecerLivro(livroBase, todosLivros)
  return aplicarAutopreenchimento(livro, formValues)
}

// Compat: versão DOM antiga (mantida para fallback)
export function aplicarAutopreenchimentoDOM(livro) {
  const campos = {
    fTitulo: livro.titulo,
    fAutor: livro.autor, fEditora: livro.editora, fIsbn: livro.isbn,
    fAno: livro.ano, fPaginas: livro.paginas, fCapa: livro.capa, fDesc: livro.descricao
  }
  let preenchidos = 0
  for (const [id, valor] of Object.entries(campos)) {
    const el = document.getElementById(id)
    if (valor && el && !el.value.trim()) { el.value = valor; preenchidos++ }
  }
  return preenchidos
}
