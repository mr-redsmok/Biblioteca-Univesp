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
export function filtrarLivros(termo) {
    const t = (termo || '').trim().toLowerCase();
    if (!t) return livros;
    return livros.filter(l =>
        l.titulo.toLowerCase().includes(t) ||
        l.autor.toLowerCase().includes(t) ||
        l.editora.toLowerCase().includes(t) ||
        l.isbn.includes(t)
    );
}

export function obterListaCatalogo() {
    const termo = (document.getElementById('filtro').value || '').toLowerCase();
    const autor = (document.getElementById('filtroAutor').value || '').toLowerCase();
    const editora = (document.getElementById('filtroEditora').value || '').toLowerCase();
    const ano = String(document.getElementById('filtroAno').value || '').trim();
    const ordem = document.getElementById('filtroOrdem').value;

    let lista = livros.filter(l =>
        (!termo ||
            l.titulo.toLowerCase().includes(termo) ||
            l.autor.toLowerCase().includes(termo) ||
            l.editora.toLowerCase().includes(termo) ||
            l.isbn.includes(termo)) &&
        (!autor || l.autor.toLowerCase().includes(autor)) &&
        (!editora || l.editora.toLowerCase().includes(editora)) &&
        (!ano || String(l.ano) === ano)
    );

    const pt = (a, b) => (a || '').localeCompare(b || '', 'pt', { sensitivity: 'base' });
    if (ordem === 'titulo-az') lista.sort((a, b) => pt(a.titulo, b.titulo));
    else if (ordem === 'titulo-za') lista.sort((a, b) => pt(b.titulo, a.titulo));
    else if (ordem === 'ano-desc') lista.sort((a, b) => (b.ano || 0) - (a.ano || 0));
    else if (ordem === 'ano-asc') lista.sort((a, b) => (a.ano || 0) - (b.ano || 0));

    return lista;
}
