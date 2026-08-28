/* ================= MAIN ================= */
import { atualizarSugestoes, atualizarFiltrosDinamicos, livros as _livros, STORAGE_KEY } from './storage.js';
import { renderCatalogo } from './ui/catalog.js';
import { adicionarLivro, editarLivro, excluirLivro, filtrarLivros, filtrarECatalogo } from './crud.js';
import { validarLivro, sanitizar } from './validate.js';
import { normIsbn } from './utils.js';
import { switchTab } from './ui/tabs.js';
// import { autopreencherPorTitulo } from './ui/form.js'; // descomentar quando reativar
import { buscarLivros } from './api.js';
import { escolherMelhorResultado, aplicarAutopreenchimento } from './autofill.js';
// módulos de efeito colateral (registram listeners no DOM):
import './ui/search.js';
import './ui/io.js';
import './ui/modal.js';

/* ================= INIT ================= */
atualizarSugestoes();
atualizarFiltrosDinamicos();
renderCatalogo();

/* ================= API PARA TESTES ================= */
window.__TEST__ = {
    adicionarLivro, editarLivro, excluirLivro, filtrarLivros, filtrarECatalogo, validarLivro,
    getLivros: () => _livros, getStorageKey: () => STORAGE_KEY,
    normIsbn, sanitizar, switchTab, renderCatalogo, atualizarSugestoes,
    atualizarFiltrosDinamicos,
    buscarLivros, escolherMelhorResultado, aplicarAutopreenchimento
};
