/* ================= UTILS ================= */
export function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
export function normIsbn(v) {
    return (v || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}
export function toast(msg, tipo) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = tipo === 'ok' || tipo === 'err' ? tipo : '';
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}
export function esc(s) {
    return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function formatDesc(v) {
    const s = (v || '').replace(/<[^>]*>/g, '');
    return s.length > 140 ? s.slice(0, 137) + '…' : s;
}
