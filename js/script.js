/* ================= ESTADO ================= */
const STORAGE_KEY = 'sgbl_livros';
let livros = load();

function load() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) return [];
const arr = JSON.parse(raw);
return Array.isArray(arr) ? arr : [];
} catch (e) {
console.warn('Falha ao ler acervo:', e);
return [];
}
}
function save() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(livros));
atualizarSugestoes();
atualizarFiltrosDinamicos();
}
function newId() {
return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function normIsbn(v) {
return (v || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}
function toast(msg, tipo) {
const el = document.getElementById('toast');
el.textContent = msg;
el.className = tipo === 'ok' || tipo === 'err' ? tipo : '';
el.classList.add('show');
clearTimeout(toast._t);
toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ================= VALIDAÇÃO ================= */
function validarLivro(d) {
const erros = [];
if (!d.titulo || !d.titulo.trim()) erros.push('título é obrigatório');
const ano = Number(d.ano);
if (d.ano && (!Number.isInteger(ano) || ano < 0 || ano > 2100)) erros.push('ano inválido');
const paginas = Number(d.paginas);
if (d.paginas && (!Number.isInteger(paginas) || paginas < 1)) erros.push('páginas inválidas');
const exemplares = Number(d.exemplares || 1);
if (!Number.isInteger(exemplares) || exemplares < 1) erros.push('exemplares deve ser ≥ 1');
if (d.isbn) {
const n = normIsbn(d.isbn);
if (n.length < 10) erros.push('ISBN inválido (mínimo 10 dígitos)');
}
if (d.capa && !/^https?:\/\//i.test(d.capa)) erros.push('URL da capa deve começar com http(s)');
return { ok: erros.length === 0, erros };
}
function sanitizar(d) {
const agora = new Date().toISOString();
return {
id: d.id || newId(),
titulo: d.titulo.trim(),
autor: (d.autor || '').trim(),
editora: (d.editora || '').trim(),
isbn: normIsbn(d.isbn),
ano: d.ano ? String(d.ano) : '',
paginas: d.paginas ? String(d.paginas) : '',
capa: (d.capa || '').trim(),
descricao: (d.descricao || '').trim(),
exemplares: Math.max(1, Number(d.exemplares) || 1),
criadoEm: d.criadoEm || agora,
atualizadoEm: agora
};
}
function isbnDuplicado(isbn, ignorarId) {
if (!isbn) return false;
return livros.some(l => l.isbn === isbn && l.id !== ignorarId);
}

/* ================= CRUD ================= */
function adicionarLivro(dados) {
const v = validarLivro(dados);
if (!v.ok) throw new Error(v.erros.join('; '));
if (isbnDuplicado(normIsbn(dados.isbn))) throw new Error('ISBN já cadastrado no acervo');
const livro = sanitizar(dados);
livros.push(livro);
save();
return livro;
}
function editarLivro(id, dados) {
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
function excluirLivro(id) {
const antes = livros.length;
livros = livros.filter(l => l.id !== id);
if (livros.length === antes) throw new Error('Livro não encontrado');
save();
}
function filtrarLivros(termo) {
const t = (termo || '').trim().toLowerCase();
if (!t) return livros;
return livros.filter(l =>
l.titulo.toLowerCase().includes(t) ||
l.autor.toLowerCase().includes(t) ||
l.editora.toLowerCase().includes(t) ||
l.isbn.includes(t)
);
}

function obterListaCatalogo() {
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

function atualizarFiltrosDinamicos() {
const autores = [...new Set(livros.map(l => (l.autor || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
const editoras = [...new Set(livros.map(l => (l.editora || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
const selAutor = document.getElementById('filtroAutor');
const selEditora = document.getElementById('filtroEditora');
const vAutor = selAutor.value;
const vEditora = selEditora.value;
selAutor.innerHTML = '<option value="">Todos</option>';
for (const a of autores) {
const opt = document.createElement('option');
opt.value = a;
opt.textContent = a;
selAutor.appendChild(opt);
}
selEditora.innerHTML = '<option value="">Todas</option>';
for (const e of editoras) {
const opt = document.createElement('option');
opt.value = e;
opt.textContent = e;
selEditora.appendChild(opt);
}
selAutor.value = vAutor;
selEditora.value = vEditora;
}

/* ================= SUGESTÕES DE PREENCHIMENTO ================= */
function atualizarSugestoes() {
const map = { 'sug-titulo': 'titulo', 'sug-autor': 'autor', 'sug-editora': 'editora', 'sug-isbn': 'isbn' };
for (const [dlId, campo] of Object.entries(map)) {
const dl = document.getElementById(dlId);
if (!dl) continue;
const valores = [...new Set(livros.map(l => (l[campo] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
dl.innerHTML = '';
for (const v of valores) {
    const opt = document.createElement('option');
    opt.value = v;
    dl.appendChild(opt);
}
}
}

function autopreencherPorTitulo() {
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
}

/* ================= RENDER: catálogo ================= */
const gridCatalogo = document.getElementById('gridCatalogo');
const msgCatalogo = document.getElementById('msgCatalogo');
const filtro = document.getElementById('filtro');
const countEl = document.getElementById('count');

function esc(s) {
return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatDesc(v) {
const s = (v || '').replace(/<[^>]*>/g, '');
return s.length > 140 ? s.slice(0, 137) + '…' : s;
}

function renderCatalogo() {
const lista = obterListaCatalogo();
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

/* ================= RENDER: formulário ================= */
const formLivro = document.getElementById('formLivro');
const fId = document.getElementById('fId');
const linkCancelarEdit = document.getElementById('linkCancelarEdit');
const btnSalvar = document.getElementById('btnSalvar');

function preencherForm(livro) {
fId.value = livro ? livro.id : '';
document.getElementById('fTitulo').value = livro ? livro.titulo : '';
document.getElementById('fAutor').value = livro ? livro.autor : '';
document.getElementById('fEditora').value = livro ? livro.editora : '';
document.getElementById('fIsbn').value = livro ? livro.isbn : '';
document.getElementById('fAno').value = livro ? livro.ano : '';
document.getElementById('fPaginas').value = livro ? livro.paginas : '';
document.getElementById('fExemplares').value = livro ? livro.exemplares : 1;
document.getElementById('fCapa').value = livro ? livro.capa : '';
document.getElementById('fDesc').value = livro ? livro.descricao : '';
btnSalvar.textContent = livro ? '💾 Salvar alterações' : '💾 Salvar livro';
linkCancelarEdit.style.display = livro ? '' : 'none';
}
function limparForm() { preencherForm(null); }

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

/* ================= ABAS ================= */
function switchTab(nome) {
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

let pendenteExclusao = null;
function confirmarExclusao(id) {
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

document.getElementById('btnLimpar').addEventListener('click', limparForm);
linkCancelarEdit.addEventListener('click', (e) => { e.preventDefault(); limparForm(); });
filtro.addEventListener('input', renderCatalogo);
document.getElementById('filtroOrdem').addEventListener('change', renderCatalogo);
document.getElementById('filtroAutor').addEventListener('change', renderCatalogo);
document.getElementById('filtroEditora').addEventListener('change', renderCatalogo);
document.getElementById('filtroAno').addEventListener('input', renderCatalogo);
document.getElementById('fTitulo').addEventListener('blur', autopreencherPorTitulo);

/* ================= EXPORTAR / IMPORTAR ================= */
document.getElementById('btnExportar').addEventListener('click', () => {
if (livros.length === 0) { toast('Acervo vazio — nada para exportar.', 'err'); return; }
const blob = new Blob([JSON.stringify(livros, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'acervo-biblioteca.json';
a.click();
URL.revokeObjectURL(url);
toast('Acervo exportado!', 'ok');
});
document.getElementById('btnImportar').addEventListener('click', () => {
document.getElementById('fileImport').click();
});
document.getElementById('fileImport').addEventListener('change', (e) => {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = () => {
try {
    const arr = JSON.parse(reader.result);
    if (!Array.isArray(arr)) throw new Error('arquivo inválido');
    let add = 0, dup = 0;
    for (const item of arr) {
    try {
        adicionarLivro(item);
        add++;
    } catch (err) {
        if (String(err.message).includes('ISBN')) dup++; else throw err;
    }
    }
    renderCatalogo();
    toast('Importados ' + add + ' livro(s)' + (dup ? ' · ' + dup + ' duplicados ignorados' : ''), 'ok');
} catch (err) {
    toast('Importação falhou: ' + err.message, 'err');
}
};
reader.readAsText(file);
e.target.value = '';
});

/* ================= BUSCA NA API (Google Books + Open Library) ================= */
const form = document.getElementById('form');
const input = document.getElementById('q');
const btn = document.getElementById('btn');
const msg = document.getElementById('msg');
const grid = document.getElementById('grid');
const fonte = document.getElementById('fonte');

function showMsg(text, isError) {
msg.textContent = text;
msg.className = 'msg' + (isError ? ' error' : '');
msg.style.display = '';
grid.style.display = 'none';
grid.innerHTML = '';
fonte.style.display = 'none';
}

async function buscarGoogleBooks(q, autor) {
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
function extraiIsbn(vol) {
const ids = (vol.volumeInfo && vol.volumeInfo.industryIdentifiers) || [];
const isbn13 = ids.find(i => i.type === 'ISBN_13');
const isbn10 = ids.find(i => i.type === 'ISBN_10');
return normIsbn((isbn13 || isbn10 || {}).identifier);
}

async function buscarOpenLibrary(q, autor) {
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

async function buscarLivros(q, autor) {
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

function jaNoAcervo(livro) {
return livro.isbn ? livros.some(l => l.isbn === livro.isbn) : false;
}

function renderBusca(livrosApi) {
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
const noAcervo = jaNoAcervo(b);

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
        '<button class="btn-small" data-add="' + esc(b.titulo) + '" data-idx="' + livrosApi.indexOf(b) + '" ' +
        (noAcervo ? 'disabled' : '') + '>' + (noAcervo ? '✓ Já no acervo' : '➕ Adicionar ao acervo') + '</button>' +
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
try {
adicionarLivro(b);
btnAdd.textContent = '✓ Já no acervo';
btnAdd.disabled = true;
toast('"' + b.titulo + '" adicionado ao acervo!', 'ok');
} catch (err) {
toast('Erro: ' + err.message, 'err');
renderBusca(ultimaBusca);
}
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

/* ================= AUTO PREENCHER (via API) ================= */
const btnAutoPreencher = document.getElementById('btnAutoPreencher');

function escolherMelhorResultado(livrosApi, titulo, autor) {
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const alvo = norm(titulo);
const alvoAutor = norm(autor);
if (!alvo) return livrosApi[0];

const freq = {};
for (const l of livrosApi) {
const a = norm(l.autor);
if (a) freq[a] = (freq[a] || 0) + 1;
}
let maxFreq = 0;
for (const k in freq) maxFreq = Math.max(maxFreq, freq[k]);
const autorDominante = maxFreq > 1 ? Object.keys(freq).find(k => freq[k] === maxFreq) : null;

const bateAutor = (l) => {
const na = norm(l.autor);
if (!na) return false;
if (na === alvoAutor) return true;
return alvoAutor.length > 2 && (na.includes(alvoAutor) || alvoAutor.includes(na));
};

let melhor = null;
let melhorPts = -1;
for (const l of livrosApi) {
const nt = norm(l.titulo);
let pts = 0;
if (nt === alvo) pts += 5;
else if (nt.includes(alvo) || alvo.includes(nt)) pts += 3;
if (autorDominante && norm(l.autor) === autorDominante) pts += 4;
if (alvoAutor && bateAutor(l)) pts += 5;
if (l.autor) pts += 1;
if (l.ano) pts += 1;
if (l.capa) pts += 1;
if (l.isbn) pts += 1;
pts += Math.min(l.edition_count || 0, 100) / 20;
if (pts > melhorPts) { melhorPts = pts; melhor = l; }
}
if (melhorPts <= 0) return null;
const sinais = (melhor.autor ? 1 : 0) + (melhor.ano ? 1 : 0) + (melhor.capa ? 1 : 0) +
(melhor.isbn ? 1 : 0) + ((melhor.edition_count || 0) > 1 ? 1 : 0);
const nt = norm(melhor.titulo);
const temMatchTitulo = (nt === alvo) || nt.includes(alvo) || alvo.includes(nt);
if (temMatchTitulo) {
if (sinais < 2) return null;
if (melhor.autor) return melhor;
const consolidado = livrosApi.find(l => l !== melhor && l.autor && (l.edition_count || 0) >= 10);
return consolidado || melhor;
}
const muitasEdicoes = (melhor.edition_count || 0) >= 10;
if (melhor.autor && muitasEdicoes) return melhor;
return null;
}

function aplicarAutopreenchimento(livro, fonte) {
const campos = {
fAutor: livro.autor, fEditora: livro.editora, fIsbn: livro.isbn,
fAno: livro.ano, fPaginas: livro.paginas, fCapa: livro.capa, fDesc: livro.descricao
};
let preenchidos = 0;
for (const [id, valor] of Object.entries(campos)) {
const el = document.getElementById(id);
if (valor && !el.value.trim()) { el.value = valor; preenchidos++; }
}
return preenchidos;
}

btnAutoPreencher.addEventListener('click', async () => {
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
});

/* ================= INIT ================= */
atualizarSugestoes();
atualizarFiltrosDinamicos();
renderCatalogo();

/* ================= API PARA TESTES ================= */
window.__TEST__ = {
adicionarLivro, editarLivro, excluirLivro, filtrarLivros, validarLivro,
getLivros: () => livros, getStorageKey: () => STORAGE_KEY,
normIsbn, sanitizar, switchTab, renderCatalogo, atualizarSugestoes, autopreencherPorTitulo,
obterListaCatalogo, atualizarFiltrosDinamicos,
buscarLivros, escolherMelhorResultado, aplicarAutopreenchimento
};