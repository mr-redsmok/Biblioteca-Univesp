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
            idioma: v.language,
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
    const qIsbn = /[\dXx-]{10,}/.test(q) ? normIsbn(q) : '';
    if (qIsbn) {
        const res = await fetch('https://openlibrary.org/isbn/' + qIsbn + '.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const e = await res.json();
        let descricao = '';
        const workKey = e.works && e.works[0] && e.works[0].key;
        if (workKey) {
            try {
                const wr = await fetch('https://openlibrary.org' + workKey + '.json');
                if (wr.ok) {
                    const w = await wr.json();
                    const desc = w.description;
                    descricao = typeof desc === 'string' ? desc : (desc && desc.value) || '';
                }
            } catch (_) { /* ignora descrição da obra */ }
        }
        const lang = (e.languages || []).map((l) => (l.key || '').replace('/languages/', '')).join(',') || 'por';
        return [{
            titulo: e.title,
            autor: '',
            editora: (e.publishers || [])[0] || '',
            ano: String(e.publish_date || '').slice(0, 4),
            isbn: qIsbn,
            paginas: e.number_of_pages || '',
            capa: 'https://covers.openlibrary.org/b/isbn/' + qIsbn + '-M.jpg',
            descricao,
            idioma: lang,
            link: workKey ? 'https://openlibrary.org' + workKey : null,
            edition_count: 0
        }];
    }
    let url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=20&language=por';
    if (autor && autor.trim()) url += '&author=' + encodeURIComponent(autor.trim());
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data.docs || []).map(d => {
        const langs = d.language || [];
        const idioma = (langs.includes('por') || langs.includes('pt')) ? 'por' : (langs[0] || '');
        return {
            titulo: d.title,
            autor: (d.author_name || []).join(', '),
            editora: (d.publisher || [])[0],
            ano: d.first_publish_year,
            isbn: normIsbn((d.isbn || [])[0]),
            paginas: d.number_of_pages_median,
            capa: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg' : null,
            descricao: d.first_sentence ? d.first_sentence[0] : (d.subtitle || ''),
            idioma,
            link: d.key ? 'https://openlibrary.org' + d.key : null,
            edition_count: d.edition_count
        };
    });
}

export async function buscarLivros(q, autor) {
    const [gb, ol] = await Promise.allSettled([
        buscarGoogleBooks(q, autor),
        buscarOpenLibrary(q, autor)
    ]);
    const livros = [];
    const fontes = [];
    if (gb.status === 'fulfilled') { livros.push(...gb.value); fontes.push('Google Books'); }
    if (ol.status === 'fulfilled') { livros.push(...ol.value); fontes.push('Open Library'); }
    if (livros.length === 0) {
        const erros = [gb, ol]
            .map((r) => r.status === 'rejected' ? r.reason.message : null)
            .filter(Boolean);
        throw new Error('Google Books e Open Library falharam: ' + erros.join(' · '));
    }
    return { livros, fonte: fontes.join(' + ') };
}

export function jaNoAcervo(livro) {
    return livro.isbn ? livros.some(l => l.isbn === livro.isbn) : false;
}
