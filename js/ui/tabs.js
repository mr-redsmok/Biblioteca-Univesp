/* ================= ABAS ================= */
import { renderCatalogo } from './catalog.js';

export function switchTab(nome) {
    document.querySelectorAll('.tab').forEach(t => {
        const ativo = t.dataset.view === nome;
        t.classList.toggle('active', ativo);
        t.setAttribute('aria-selected', ativo ? 'true' : 'false');
    });
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === 'view-' + nome);
    });
    if (nome === 'catalogo') renderCatalogo();
}

document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.view));
});
