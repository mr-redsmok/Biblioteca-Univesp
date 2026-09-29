/* Metadados exibidos nos cards — extraído de Catalog/Search para evitar duplicação */
export function metaBits(livro) {
  const bits = []
  if (!livro) return bits
  if (livro.editora) bits.push(livro.editora)
  if (livro.ano) bits.push(livro.ano)
  if (livro.paginas) bits.push(livro.paginas + ' págs')
  if (livro.isbn) bits.push('ISBN ' + livro.isbn)
  if (livro.exemplaresLista?.length) {
    bits.push('Tombo: ' + livro.exemplaresLista.map(e => e.tombo).join(', '))
  }
  if (livro.estadoLivro) bits.push(livro.estadoLivro === 'novo' ? 'Novo' : livro.estadoLivro === 'usado' ? 'Usado' : livro.estadoLivro)
  if (livro.metodoAquisicao) bits.push(livro.metodoAquisicao === 'compra' ? 'Compra' : livro.metodoAquisicao === 'doacao' ? 'Doação' : livro.metodoAquisicao)
  return bits
}

export function metaBusca(b) {
  const bits = []
  if (!b) return bits
  if (b.editora) bits.push(b.editora)
  if (b.ano) bits.push(String(b.ano))
  if (b.paginas) bits.push(b.paginas + ' págs')
  if (b.isbn) bits.push('ISBN ' + b.isbn)
  return bits
}
