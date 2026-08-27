/* ================= BUSCA NA API (Google Books + Open Library) ================= */
import { normIsbn } from './utils.js';
import { livros } from './storage.js';

export async function buscarGoogleBooks(q, autor) {
    let query = encodeURIComponent(q);
    if (autor && autor.trim()) query += '+inauthor:' + encodeURIComponent(autor.trim());
    const res = await fetch('https://www.googleapis.com/books/v1/volumes?q=' +
        query + '&maxResults=20&langRestrict=pt');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data.items || []).map(it => {
        const v = it.volumeInfo || {};
        return {
            titulo: v.title,
            autor: (v.authors || []).join(', '),
            editora: v.publisher,
            ano: (v.publishedDate || '').slice(0, 4),
            isbn: extraiIsbn(it),
            paginas: v.pageCount,
            capa: (v.imageLinks && v.imageLinks.thumbnail) || null,
            descricao: v.description,
            link: v.infoLink || null
        };
    });
}
export function extraiIsbn(vol) {
    const ids = (vol.volumeInfo && vol.volumeInfo.industryIdentifiers) || [];
    const isbn13 = ids.find(i => i.type === 'ISBN_13');
    const isbn10 = ids.find(i => i.type === 'ISBN_10');
    return normIsbn((isbn13 || isbn10 || {}).identifier);
}

export async function buscarOpenLibrary(q, autor) {
    let url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=20';
    if (autor && autor.trim()) url += '&author=' + encodeURIComponent(autor.trim());
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data.docs || []).map(d => ({
        titulo: d.title,
        autor: (d.author_name || []).join(', '),
        editora: (d.publisher || [])[0],
        ano: d.first_publish_year,
        isbn: normIsbn((d.isbn || [])[0]),
        paginas: d.number_of_pages_median,
        capa: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg' : null,
        descricao: d.first_sentence ? d.first_sentence[0] : (d.subtitle || ''),
        link: d.key ? 'https://openlibrary.org' + d.key : null,
        edition_count: d.edition_count
    }));
}

export async function buscarLivros(q, autor) {
    const tentativas = [buscarGoogleBooks, buscarOpenLibrary];
    const erros = [];
    for (const api of tentativas) {
        try {
            const livrosApi = await api(q, autor);
            return { livros: livrosApi, fonte: api === buscarGoogleBooks ? 'Google Books' : 'Open Library' };
        } catch (e) {
            erros.push((api === buscarGoogleBooks ? 'Google Books' : 'Open Library') + ' (' + e.message + ')');
        }
    }
    throw new Error('Google Books e Open Library falharam: ' + erros.join(' · '));
}

export function jaNoAcervo(livro) {
    return livro.isbn ? livros.some(l => l.isbn === livro.isbn) : false;
}
