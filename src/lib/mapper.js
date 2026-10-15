// Mapper Vue <-> Supabase (tabela `livro`).
// Vue usa camelCase + campos locais; Supabase usa snake_case e só colunas do banco.
// Fora do recorte (fase 2): estadoLivro/metodoAquisicao -> exemplares,
// exemplaresLista -> 1 linha em `exemplares` por tombo.

export function toSupabase(livro) {
  return {
    id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor || null,
    editora: livro.editora || null,
    isbn: livro.isbn || null,
    ano: livro.ano ? String(livro.ano) : null,
    paginas: livro.paginas ? String(livro.paginas) : null,
    capa: livro.capa || null,
    descricao: livro.descricao || null,
    exemplares: Math.max(1, Number(livro.exemplares) || 1)
  }
}

export function fromSupabase(row) {
  return {
    id: row.id,
    titulo: row.titulo || '',
    autor: row.autor || '',
    editora: row.editora || '',
    isbn: row.isbn || '',
    ano: row.ano || '',
    paginas: row.paginas || '',
    capa: row.capa || '',
    descricao: row.descricao || '',
    exemplares: row.exemplares ?? 1,
    exemplaresLista: [],
    estadoLivro: '',
    metodoAquisicao: '',
    criadoEm: row.criado_em || null,
    atualizadoEm: row.atualizado_em || null
  }
}

export function isIsbnDuplicadoErro(err) {
  return err?.code === '23505' || String(err?.message || '').toLowerCase().includes('isbn')
}

export function toExemplar(livroId, item, meta) {
  return {
    livro_id: livroId,
    tombo: item.tombo,
    status: 'disponivel',
    estado_livro: meta.estadoLivro || null,
    metodo_aquisicao: meta.metodoAquisicao || null
  }
}
export function fromExemplar(row) {
  return {id: row.id, tombo: row.tombo }
}
