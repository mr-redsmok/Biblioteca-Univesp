/* ================= RENDER: busca (API) ================= */
import { esc, formatDesc, toast, normIsbn } from '../utils.js';
import { buscarLivros } from '../api.js';
import { livros } from '../storage.js';
import { preencherForm } from './form.js';
import { switchTab } from './tabs.js';

const form = document.getElementById('form');
const input = document.getElementById('q');
const btn = document.getElementById('btn');
const msg = document.getElementById('msg');
const grid = document.getElementById('grid');
const fonte = document.getElementById('fonte');

export function showMsg(text, isError) {
    msg.textContent = text;
    msg.className = 'msg' + (isError ? ' error' : '');
    msg.style.display = '';
    grid.style.display = 'none';
    grid.innerHTML = '';
    fonte.style.display = 'none';
}

export function renderBusca(livrosApi) {
    if (!livrosApi || livrosApi.length === 0) {
        showMsg('Nenhum livro encontrado. Tente outro termo.');
        return;
    }
    msg.style.display = 'none';
    grid.innerHTML = '';
    grid.style.display = '';

    for (const b of livrosApi) {
        const metaBits = [];
        if (b.editora) metaBits.push(esc(b.editora));
        if (b.ano) metaBits.push(esc(String(b.ano)));
        if (b.paginas) metaBits.push(b.paginas + ' págs');
        if (b.isbn) metaBits.push('ISBN ' + b.isbn);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML =
            '<div class="thumb">' +
            (b.capa
                ? '<img src="' + esc(b.capa) + '" alt="Capa" loading="lazy" onerror="this.outerHTML=\'<div class=&quot;no-img&quot;>Sem capa</div>\'">'
                : '<div class="no-img">Sem capa</div>') +
            '</div>' +
            '<div class="info">' +
            '<div class="title">' + esc(b.titulo || 'Sem título') + '</div>' +
            '<div class="author">' + esc(b.autor || 'Autor desconhecido') + '</div>' +
            (metaBits.length ? '<div class="meta">' + metaBits.join(' · ') + '</div>' : '') +
            '<div class="desc">' + esc(formatDesc(b.descricao)) + '</div>' +
            (b.link ? '<a href="' + esc(b.link) + '" target="_blank" rel="noopener">Ver detalhes →</a>' : '') +
            '<div class="card-actions">' +
            '<button class="btn-small" data-add="' + esc(b.titulo) + '" data-idx="' + livrosApi.indexOf(b) + '">➕ Pré-cadastro</button>' +
            '</div>' +
            '</div>';
        grid.appendChild(card);
    }
}

grid.addEventListener('click', (e) => {
    const btnAdd = e.target.closest('button[data-add]');
    if (!btnAdd) return;
    const idx = Number(btnAdd.dataset.idx);
    const ultimaBusca = grid._ultimaBusca || [];
    const b = ultimaBusca[idx];
    if (!b) return;
    const existente = b.isbn
        ? livros.find(l => l.isbn && normIsbn(l.isbn) === normIsbn(b.isbn))
        : livros.find(l => l.titulo && l.titulo.trim().toLowerCase() === (b.titulo || '').trim().toLowerCase());
    preencherForm(existente || b);
    switchTab('cadastrar');
    toast(existente ? 'Livro já no acervo: aberto para edição.' : 'Pré-cadastro: revise os dados e clique em "Salvar livro".', 'ok');
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) { showMsg('Digite o nome de um livro.'); return; }

    btn.disabled = true;
    showMsg('Buscando…');

    try {
        const r = await buscarLivros(q);
        fonte.textContent = 'Resultados de: ' + r.fonte;
        fonte.style.display = '';
        grid._ultimaBusca = r.livros;
        renderBusca(r.livros);
    } catch (err) {
        showMsg('Não foi possível buscar: ' + err.message, true);
    } finally {
        btn.disabled = false;
    }
});
