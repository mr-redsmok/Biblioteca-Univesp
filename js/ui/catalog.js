/* ================= RENDER: catálogo ================= */
import { livros } from '../storage.js';
import { filtrarECatalogo, excluirLivro } from '../crud.js';
import { esc, formatDesc } from '../utils.js';
import { preencherForm } from './form.js';
import { switchTab } from './tabs.js';
import { confirmarExclusao } from './modal.js';

const gridCatalogo = document.getElementById('gridCatalogo');
const msgCatalogo = document.getElementById('msgCatalogo');
const filtro = document.getElementById('filtro');
const countEl = document.getElementById('count');

export function renderCatalogo() {
    const criterios = {
        termo: (document.getElementById('filtro').value || '').trim(),
        autor: (document.getElementById('filtroAutor').value || '').trim(),
        editora: (document.getElementById('filtroEditora').value || '').trim(),
        ano: (document.getElementById('filtroAno').value || '').trim(),
        ordem: document.getElementById('filtroOrdem').value
    };
    const lista = filtrarECatalogo(livros, criterios);
    countEl.textContent = livros.length + (lista.length !== livros.length ? ' · ' + lista.length + ' filtrados' : '') + ' livro(s)';
    if (livros.length === 0) {
        msgCatalogo.style.display = '';
        msgCatalogo.textContent = 'Nenhum livro no acervo ainda. Cadastre ou busque livros.';
        gridCatalogo.style.display = 'none';
        gridCatalogo.innerHTML = '';
        return;
    }
    if (lista.length === 0) {
        msgCatalogo.style.display = '';
        msgCatalogo.textContent = 'Nenhum livro corresponde ao filtro.';
        gridCatalogo.style.display = 'none';
        gridCatalogo.innerHTML = '';
        return;
    }
    msgCatalogo.style.display = 'none';
    gridCatalogo.innerHTML = '';
    gridCatalogo.style.display = '';

    for (const l of lista) {
        const metaBits = [];
        if (l.editora) metaBits.push(esc(l.editora));
        if (l.ano) metaBits.push(esc(l.ano));
        if (l.paginas) metaBits.push(l.paginas + ' págs');
        if (l.isbn) metaBits.push('ISBN ' + l.isbn);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML =
            '<div class="thumb">' +
            (l.capa
                ? '<img src="' + esc(l.capa) + '" alt="Capa de ' + esc(l.titulo) + '" loading="lazy" onerror="this.outerHTML=\'<div class=&quot;no-img&quot;>Sem capa</div>\'">'
                : '<div class="no-img">Sem capa</div>') +
            '</div>' +
            '<div class="info">' +
            '<div class="title">' + esc(l.titulo) + '</div>' +
            '<div class="author">' + esc(l.autor || 'Autor desconhecido') + '</div>' +
            (metaBits.length ? '<div class="meta">' + metaBits.join(' · ') + '</div>' : '') +
            '<div class="desc">' + esc(formatDesc(l.descricao)) + '</div>' +
            '<span class="badge ' + (l.exemplares > 0 ? 'ok' : 'err') + '">' + l.exemplares + ' exemplar(es) ' + (l.exemplares > 0 ? 'disponível(is)' : '— esgotado') + '</span>' +
            '<div class="card-actions">' +
            '<a href="#" data-edit="' + l.id + '" role="button">✏️ Editar</a> &nbsp; ' +
            '<a href="#" data-del="' + l.id + '" role="button" style="color:var(--err)">🗑️ Excluir</a>' +
            '</div>' +
            '</div>';
        gridCatalogo.appendChild(card);
    }
}

/* ================= AÇÕES DO CATÁLOGO ================= */
gridCatalogo.addEventListener('click', (e) => {
    const alvo = e.target.closest('a[data-edit], a[data-del]');
    if (!alvo) return;
    e.preventDefault();
    const id = alvo.dataset.edit || alvo.dataset.del;
    if (alvo.dataset.edit) {
        const livro = livros.find(l => l.id === id);
        if (!livro) return;
        preencherForm(livro);
        switchTab('cadastrar');
    } else {
        confirmarExclusao(id);
    }
});

/* ================= FILTROS ================= */
filtro.addEventListener('input', renderCatalogo);
document.getElementById('filtroOrdem').addEventListener('change', renderCatalogo);
document.getElementById('filtroAutor').addEventListener('change', renderCatalogo);
document.getElementById('filtroEditora').addEventListener('change', renderCatalogo);
document.getElementById('filtroAno').addEventListener('input', renderCatalogo);
