/* ================= EXPORTAR / IMPORTAR ================= */
import { livros } from '../storage.js';
import { adicionarLivro } from '../crud.js';
import { toast } from '../utils.js';
import { renderCatalogo } from './catalog.js';

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
