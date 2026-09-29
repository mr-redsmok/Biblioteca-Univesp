/* ================= VALIDAÇÃO ================= */
import { newId, normIsbn } from './utils.js'

// Validação pura — não depende de store para facilitar testes
export function validarLivro(d) {
  const erros = []
  if (!d.titulo || !d.titulo.trim()) erros.push('título é obrigatório')
  const ano = Number(d.ano)
  if (d.ano && (!Number.isInteger(ano) || ano < 0 || ano > 2100)) erros.push('ano inválido')
  const paginas = Number(d.paginas)
  if (d.paginas && (!Number.isInteger(paginas) || paginas < 1)) erros.push('páginas inválidas')
  const exemplares = Number(d.exemplares || 1)
  if (!Number.isInteger(exemplares) || exemplares < 1) erros.push('exemplares deve ser ≥ 1')
  if (d.isbn && d.isbn.trim()) {
    const n = normIsbn(d.isbn)
    if (n.length < 10) erros.push('ISBN inválido (mínimo 10 dígitos)')
  }
  if (d.capa && !/^https?:\/\//i.test(d.capa)) erros.push('URL da capa deve começar com http(s)')
  if (!d.estadoLivro || !d.estadoLivro.trim()) erros.push('estado do livro é obrigatório')
  else if (!['novo', 'usado'].includes(d.estadoLivro)) erros.push('estado do livro inválido')
  if (!d.metodoAquisicao || !d.metodoAquisicao.trim()) erros.push('método de aquisição é obrigatório')
  else if (!['compra', 'doacao'].includes(d.metodoAquisicao)) erros.push('método de aquisição inválido')
  return { ok: erros.length === 0, erros }
}

export function sanitizar(d) {
  const agora = new Date().toISOString()
  return {
    id: d.id || newId(),
    titulo: d.titulo.trim(),
    autor: (d.autor || '').trim(),
    editora: (d.editora || '').trim(),
    isbn: normIsbn(d.isbn),
    ano: d.ano ? String(d.ano) : '',
    paginas: d.paginas ? String(d.paginas) : '',
    capa: (d.capa || '').trim(),
    descricao: (d.descricao || '').trim(),
    exemplares: Math.max(1, Number(d.exemplares) || 1),
    estadoLivro: (d.estadoLivro || '').trim(),
    metodoAquisicao: (d.metodoAquisicao || '').trim(),
    criadoEm: d.criadoEm || agora,
    atualizadoEm: agora
  }
}

// Verifica duplicidade — recebe lista externa para desacoplar de localStorage
export function isbnDuplicado(isbn, livros, ignorarId) {
  if (!isbn) return false
  return livros.some(l => l.isbn === isbn && l.id !== ignorarId)
}
