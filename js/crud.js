/* ================= CRUD ================= */
import { normIsbn } from './utils.js';
import { livros, setLivros, save } from './storage.js';
import { validarLivro, sanitizar, isbnDuplicado } from './validate.js';

export function adicionarLivro(dados) {
    const v = validarLivro(dados);
    if (!v.ok) throw new Error(v.erros.join('; '));
    if (isbnDuplicado(normIsbn(dados.isbn))) throw new Error('ISBN já cadastrado no acervo');
    const livro = sanitizar(dados);
    livros.push(livro);
    save();
    return livro;
}
export function editarLivro(id, dados) {
    const idx = livros.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Livro não encontrado');
    const v = validarLivro(dados);
    if (!v.ok) throw new Error(v.erros.join('; '));
    if (isbnDuplicado(normIsbn(dados.isbn), id)) throw new Error('ISBN já cadastrado em outro livro');
    const livro = sanitizar({ ...dados, id, criadoEm: livros[idx].criadoEm });
    livros[idx] = livro;
    save();
    return livro;
}
export function excluirLivro(id) {
    const antes = livros.length;
    setLivros(livros.filter(l => l.id !== id));
    if (livros.length === antes) throw new Error('Livro não encontrado');
    save();
}
export function filtrarECatalogo(livros, criterios = {}) {
    const termo = (criterios.termo || '').trim().toLowerCase();
    const autor = (criterios.autor || '').trim().toLowerCase();
    const editora = (criterios.editora || '').trim().toLowerCase();
    const ano = String(criterios.ano || '').trim();
    const ordem = criterios.ordem || '';

    const lista = livros.filter(l => {
        const titulo = (l.titulo || '').toLowerCase();
        const aut = (l.autor || '').toLowerCase();
        const edi = (l.editora || '').toLowerCase();
        const isb = (l.isbn || '');
        return (!termo || titulo.includes(termo) || aut.includes(termo) || edi.includes(termo) || isb.includes(termo)) &&
            (!autor || aut.includes(autor)) &&
            (!editora || edi.includes(editora)) &&
            (!ano || String(l.ano || '') === ano);
    });

    const pt = (a, b) => (a || '').localeCompare(b || '', 'pt', { sensitivity: 'base' });
    if (ordem === 'titulo-az') lista.sort((a, b) => pt(a.titulo, b.titulo));
    else if (ordem === 'titulo-za') lista.sort((a, b) => pt(b.titulo, a.titulo));
    else if (ordem === 'ano-desc') lista.sort((a, b) => (b.ano || 0) - (a.ano || 0));
    else if (ordem === 'ano-asc') lista.sort((a, b) => (a.ano || 0) - (b.ano || 0));

    return lista;
}

export function filtrarLivros(termo) {
    return filtrarECatalogo(livros, { termo });
}
