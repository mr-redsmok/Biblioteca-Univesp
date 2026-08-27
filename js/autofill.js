/* ================= AUTO PREENCHER (via API) ================= */
export function escolherMelhorResultado(livrosApi, titulo, autor) {
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

export function aplicarAutopreenchimento(livro, fonte) {
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
