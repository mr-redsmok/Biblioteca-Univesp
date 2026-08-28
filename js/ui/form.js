/* ================= RENDER: formulário ================= */
import { adicionarLivro, editarLivro } from '../crud.js';
import { toast } from '../utils.js';
import { livros } from '../storage.js';
import { switchTab } from './tabs.js';
import { renderCatalogo } from './catalog.js';
import { buscarLivros } from '../api.js';
import { escolherMelhorResultado, aplicarAutopreenchimento } from '../autofill.js';

const formLivro = document.getElementById('formLivro');
const fId = document.getElementById('fId');
const linkCancelarEdit = document.getElementById('linkCancelarEdit');
const btnSalvar = document.getElementById('btnSalvar');
const btnAutoPreencher = document.getElementById('btnAutoPreencher');

export function preencherForm(livro) {
    const editando = !!(livro && livro.id);
    fId.value = editando ? livro.id : '';
    document.getElementById('fTitulo').value = livro ? livro.titulo : '';
    document.getElementById('fAutor').value = livro ? livro.autor : '';
    document.getElementById('fEditora').value = livro ? livro.editora : '';
    document.getElementById('fIsbn').value = livro ? livro.isbn : '';
    document.getElementById('fAno').value = livro ? livro.ano : '';
    document.getElementById('fPaginas').value = livro ? livro.paginas : '';
    document.getElementById('fExemplares').value = livro ? (livro.exemplares ?? 1) : 1;
    document.getElementById('fCapa').value = livro ? livro.capa : '';
    document.getElementById('fDesc').value = livro ? livro.descricao : '';
    btnSalvar.textContent = editando ? '💾 Salvar alterações' : '💾 Salvar livro';
    linkCancelarEdit.style.display = editando ? '' : 'none';
}
export function limparForm() { preencherForm(null); }

/*export function autopreencherPorTitulo() {
    if (fId.value) return; // em modo edição, não sobrescreve nada
    const titulo = document.getElementById('fTitulo').value.trim().toLowerCase();
    if (!titulo) return;
    const livro = livros.find(l => l.titulo.trim().toLowerCase() === titulo);
    if (!livro) return;
    const campos = {
        fAutor: livro.autor, fEditora: livro.editora, fIsbn: livro.isbn,
        fAno: livro.ano, fPaginas: livro.paginas, fCapa: livro.capa, fDesc: livro.descricao
    };
    let preenchidos = 0;
    for (const [id, valor] of Object.entries(campos)) {
        const el = document.getElementById(id);
        if (valor && !el.value.trim()) { el.value = valor; preenchidos++; }
    }
    if (preenchidos > 0) {
        toast('Preenchido automaticamente a partir de "' + livro.titulo + '" (' + preenchidos + ' campo(s))', 'ok');
    }
} */

export function autopreencherPorIsbn() {
    if (fId.value) return;
    const isbn = document.getElementById('fIsbn').value.trim();
    if (!isbn || isbn.length < 10) return;
    const livro = livros.find(l => l.isbn && l.isbn.replace(/[-\s]/g, '') === isbn.replace(/[-\s]/g, ''));
    if (!livro) return;
    const campos = { fTitulo: livro.titulo, fAutor: livro.autor, fEditora: livro.editora, fAno: livro.ano, fPaginas: livro.paginas, fCapa: livro.capa, fDesc: livro.descricao };
    let preenchidos = 0;
    for (const [id, valor] of Object.entries(campos)) {
        const el = document.getElementById(id);
        if (valor && !el.value.trim()) { el.value = valor; preenchidos++; }
    }
    if (preenchidos > 0) {
        toast('Preenchido a partir do ISBN "' + livro.isbn + '" (' + preenchidos + ' campo(s))', 'ok');
    }
}



formLivro.addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = {
        titulo: document.getElementById('fTitulo').value,
        autor: document.getElementById('fAutor').value,
        editora: document.getElementById('fEditora').value,
        isbn: document.getElementById('fIsbn').value,
        ano: document.getElementById('fAno').value,
        paginas: document.getElementById('fPaginas').value,
        capa: document.getElementById('fCapa').value,
        descricao: document.getElementById('fDesc').value,
        exemplares: document.getElementById('fExemplares').value
    };
    try {
        if (fId.value) {
            editarLivro(fId.value, dados);
            toast('Livro atualizado!', 'ok');
        } else {
            adicionarLivro(dados);
            toast('Livro adicionado ao acervo!', 'ok');
        }
        limparForm();
        switchTab('catalogo');
        renderCatalogo();
    } catch (err) {
        toast('Erro: ' + err.message, 'err');
    }
});

/*btnAutoPreencher.addEventListener('click', async () => {
    const titulo = document.getElementById('fTitulo').value.trim();
    if (!titulo) { toast('Digite o título primeiro.', 'err'); return; }
    const autor = document.getElementById('fAutor').value.trim();

    btnAutoPreencher.disabled = true;
    btnAutoPreencher.textContent = '⏳ Buscando…';

    try {
        const r = await buscarLivros(titulo, autor);
        if (!r.livros || r.livros.length === 0) throw new Error('nenhum resultado encontrado');
        const melhor = escolherMelhorResultado(r.livros, titulo, autor);
        if (!melhor) throw new Error('nenhum resultado confiável (' + r.fonte + '). Verifique o título ou preencha manualmente.');
        const n = aplicarAutopreenchimento(melhor, r.fonte);
        if (n === 0) toast('Nada a preencher: campos já estavam completos.', 'ok');
        else toast('Auto preenchido (' + r.fonte + '): ' + n + ' campo(s) preenchido(s).', 'ok');
    } catch (err) {
        toast('Auto preencher falhou: ' + err.message, 'err');
    } finally {
        btnAutoPreencher.disabled = false;
        btnAutoPreencher.textContent = '⚡ Auto preencher';
    }
}); */

async function buscarEPreencher(termo, tipo) {
    if (!termo) return false;
    btnAutoPreencher.disabled = true;
    btnAutoPreencher.textContent = '⏳ Buscando…';
    try {
        const r = await buscarLivros(termo);
        if (!r.livros || r.livros.length === 0) throw new Error('nenhum resultado encontrado');
        const melhor = escolherMelhorResultado(r.livros, tipo === 'titulo' ? termo : '', '', tipo === 'isbn' ? termo : '');
        if (!melhor) throw new Error('nenhum resultado confiável (' + r.fonte + '). Verifique e tente novamente.');
        let livro = melhor;
        if (!melhor.descricao || !melhor.descricao.trim()) {
            const outra = r.livros.find((l) => l !== melhor && l.descricao && l.descricao.trim());
            if (outra) livro = { ...melhor, descricao: outra.descricao };
        }
        const n = aplicarAutopreenchimento(livro, r.fonte);
        if (n === 0) toast('Nada a preencher: campos já estavam completos.', 'ok');
        else toast('Preenchido (' + r.fonte + '): ' + n + ' campo(s) preenchido(s).', 'ok');
        return true;
    } catch (err) {
        toast('Busca falhou: ' + err.message, 'err');
        return false;
    } finally {
        btnAutoPreencher.disabled = false;
        btnAutoPreencher.textContent = '⚡ Auto preencher';
    }
}

btnAutoPreencher.addEventListener('click', async () => {
    if (fId.value) { toast('Auto preencher não disponível em modo de edição.', 'err'); return; }
    const isbn = document.getElementById('fIsbn').value.trim();
    const titulo = document.getElementById('fTitulo').value.trim();
    if (isbn && isbn.length >= 10) {
        await buscarEPreencher(isbn, 'isbn');
    } else if (titulo) {
        await buscarEPreencher(titulo, 'titulo');
    } else {
        toast('Digite o ISBN ou o Título para buscar os dados.', 'err');
    }
});

document.getElementById('btnLimpar').addEventListener('click', limparForm);
linkCancelarEdit.addEventListener('click', (e) => { e.preventDefault(); limparForm(); switchTab('catalogo'); });

document.getElementById('fIsbn').addEventListener('blur', () => {
    const isbn = document.getElementById('fIsbn').value.trim();
    if (isbn && isbn.length >= 10 && !fId.value) buscarEPreencher(isbn, 'isbn');
});
document.getElementById('fTitulo').addEventListener('blur', () => {
    const titulo = document.getElementById('fTitulo').value.trim();
    if (titulo && !fId.value) buscarEPreencher(titulo, 'titulo');
});

