/* ================= MODAL DE EXCLUSÃO ================= */
import { excluirLivro } from '../crud.js';
import { toast } from '../utils.js';
import { renderCatalogo } from './catalog.js';

let pendenteExclusao = null;

export function confirmarExclusao(id) {
    pendenteExclusao = id;
    document.getElementById('modalTexto').textContent = 'Excluir este livro do acervo? Esta ação não pode ser desfeita.';
    document.getElementById('modal').classList.add('show');
}
document.getElementById('btnConfirmar').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('show');
    if (!pendenteExclusao) return;
    try {
        excluirLivro(pendenteExclusao);
        toast('Livro excluído.', 'ok');
    } catch (err) {
        toast('Erro: ' + err.message, 'err');
    }
    pendenteExclusao = null;
    renderCatalogo();
});
document.getElementById('btnCancelar').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('show');
    pendenteExclusao = null;
});
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') { document.getElementById('modal').classList.remove('show'); pendenteExclusao = null; }
});
