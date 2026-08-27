/* ================= STORAGE / ESTADO ================= */
export const STORAGE_KEY = 'sgbl_livros';
export let livros = load();

export function setLivros(arr) {
    livros = arr;
}

export function load() {
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
export function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(livros));
    atualizarSugestoes();
    atualizarFiltrosDinamicos();
}

/* ================= SUGESTÕES DE PREENCHIMENTO ================= */
export function atualizarSugestoes() {
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

export function atualizarFiltrosDinamicos() {
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
