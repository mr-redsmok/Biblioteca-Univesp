/* ================= BUSCA NA API (Google Books + Open Library) — corrigida =================
   Estratégia sem custo:
   - Open Library primeiro (ilimitado, sem key)
   - Google Books só como fallback se OL falhar/vazio ou se busca é genérica
   - Cache em memória + localStorage TTL 30min
   - AbortController + debounce no composable
   - Normalização consistente
*/
import { normIsbn } from './utils.js'
import seedLivros from '@/assets/seed.json'

const CACHE_KEY = 'sgbl_api_cache'

// Fallback local: seed com dados curados para apresentação offline (quando OL/Google falham ou dão incompleto)
function buscarSeed(q) {
  const termo = (q || '').trim()
  if (!termo) return []
  const n = normIsbn(termo)
  if (n.length >= 10) {
    // busca exata por ISBN normalizado
    return seedLivros.filter(l => normIsbn(l.isbn) === n)
  }
  const lower = termo.toLowerCase()
  // busca por título parcial (contém)
  return seedLivros.filter(l => (l.titulo || '').toLowerCase().includes(lower) || (l.autor || '').toLowerCase().includes(lower))
}
function enriquecerComSeed(livros, q) {
  const seed = buscarSeed(q)
  if (!seed.length) return livros
  // se já tem livro, complementa campos vazios com seed; senão, usa seed direto
  if (!livros.length) return seed
  return livros.map(l => {
    const s = seed.find(s => normIsbn(s.isbn) === normIsbn(l.isbn)) || seed.find(s => s.titulo.toLowerCase() === l.titulo.toLowerCase()) || seed[0]
    if (!s) return l
    return {
      ...l,
      autor: l.autor || s.autor,
      editora: l.editora || s.editora,
      ano: l.ano || s.ano,
      paginas: l.paginas || s.paginas,
      capa: l.capa || s.capa,
      descricao: l.descricao || s.descricao,
      isbn: l.isbn || s.isbn
    }
  })
}
const CACHE_TTL = 30 * 60 * 1000 // 30min
const MEM_CACHE = new Map()

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    // limpa expirados
    const now = Date.now()
    for (const k in obj) {
      if (now - obj[k].ts > CACHE_TTL) delete obj[k]
    }
    return obj
  } catch { return {} }
}
function saveCache(obj) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)) } catch {}
}
function isIsbnQuery(q) {
  const n = normIsbn(q)
  return n.length >= 10 && /[\dXx]{10,}/.test(n)
}
function chaveCache(q) {
  const trimmed = (q || '').trim()
  if (!trimmed) return ''
  if (isIsbnQuery(trimmed)) return normIsbn(trimmed)
  return trimmed.toLowerCase()
}
function getCached(q) {
  const key = chaveCache(q)
  if (!key) return null
  // compat: tenta chave normalizada e fallback para chave antiga :force
  const tryKeys = [key, key + ':force', q.toLowerCase().trim(), q.toLowerCase().trim() + ':force']
  for (const k of tryKeys) {
    if (MEM_CACHE.has(k)) {
      const v = MEM_CACHE.get(k)
      if (Date.now() - v.ts < CACHE_TTL) {
        // migra para chave normalizada se era antiga
        if (k !== key) {
          MEM_CACHE.set(key, v)
          const disk = loadCache()
          disk[key] = v
          saveCache(disk)
        }
        return v.data
      }
      MEM_CACHE.delete(k)
    }
  }
  const disk = loadCache()
  for (const k of tryKeys) {
    if (disk[k] && Date.now() - disk[k].ts < CACHE_TTL) {
      MEM_CACHE.set(key, disk[k])
      // migra
      if (k !== key) {
        disk[key] = disk[k]
        saveCache(disk)
      }
      return disk[k].data
    }
  }
  return null
}
function setCached(q, data) {
  const key = chaveCache(q)
  if (!key) return
  const entry = { data, ts: Date.now() }
  MEM_CACHE.set(key, entry)
  const disk = loadCache()
  disk[key] = entry
  // remove chaves antigas duplicadas :force se existirem
  const oldForce = q.toLowerCase().trim() + ':force'
  if (oldForce !== key && disk[oldForce]) delete disk[oldForce]
  const oldPlain = q.toLowerCase().trim()
  if (oldPlain !== key && disk[oldPlain]) delete disk[oldPlain]
  // limita tamanho
  const keys = Object.keys(disk)
  if (keys.length > 100) {
    keys.sort((a,b)=>disk[a].ts-disk[b].ts)
    for (let i=0;i<keys.length-80;i++) delete disk[keys[i]]
  }
  saveCache(disk)
}

export function limparCacheApi() {
  MEM_CACHE.clear()
  localStorage.removeItem(CACHE_KEY)
}

// ---------- Helpers ----------
function extrairAno(str) {
  if (!str) return ''
  const s = String(str)
  const m = s.match(/\b(1[0-9]{3}|20[0-9]{2})\b/)
  return m ? m[1] : s.slice(0, 4).replace(/\D/g, '').slice(0,4)
}

// ---------- Normalização ----------
function normalizarGoogleItem(it) {
  const v = it.volumeInfo || {}
  return {
    titulo: v.title || '',
    autor: (v.authors || []).join(', '),
    editora: v.publisher || '',
    ano: extrairAno(v.publishedDate),
    isbn: extraiIsbn(it),
    paginas: v.pageCount ? String(v.pageCount) : '',
    capa: v.imageLinks?.thumbnail ? v.imageLinks.thumbnail.replace(/^http:/, 'https:') : (v.imageLinks?.smallThumbnail ? v.imageLinks.smallThumbnail.replace(/^http:/, 'https:') : null),
    descricao: v.description || '',
    idioma: v.language || '',
    link: v.infoLink || v.canonicalVolumeLink || null,
    edition_count: 0,
    fonte: 'Google Books'
  }
}

function normalizarOLDoc(d) {
  const langs = d.language || []
  const idioma = (langs.includes('por') || langs.includes('pt')) ? 'por' : (langs[0] || '')
  return {
    titulo: d.title || '',
    autor: (d.author_name || []).join(', '),
    editora: (d.publisher || [])[0] || '',
    ano: d.first_publish_year ? String(d.first_publish_year) : extrairAno(d.publish_date || ''),
    isbn: normIsbn((d.isbn || [])[0]),
    paginas: d.number_of_pages_median ? String(d.number_of_pages_median) : (d.number_of_pages ? String(d.number_of_pages) : ''),
    capa: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg' : (d.cover_edition_key ? 'https://covers.openlibrary.org/b/olid/' + d.cover_edition_key + '-M.jpg' : null),
    descricao: d.first_sentence ? (Array.isArray(d.first_sentence) ? d.first_sentence[0] : d.first_sentence) : (d.subtitle || d.first_sentence || ''),
    idioma,
    link: d.key ? 'https://openlibrary.org' + d.key : null,
    edition_count: d.edition_count || 0,
    fonte: 'Open Library'
  }
}

export function extraiIsbn(vol) {
  const ids = (vol.volumeInfo && vol.volumeInfo.industryIdentifiers) || []
  const isbn13 = ids.find(i => i.type === 'ISBN_13')
  const isbn10 = ids.find(i => i.type === 'ISBN_10')
  return normIsbn((isbn13 || isbn10 || {}).identifier)
}

// ---------- Fetches com signal ----------
export async function buscarGoogleBooks(q, { signal } = {}) {
  const query = encodeURIComponent(q)
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10&langRestrict=pt`, { signal })
  if (!res.ok) {
    if (res.status === 429) throw new Error('Google Books: muitas buscas, tente novamente em 1 minuto (429)')
    throw new Error('Google Books HTTP ' + res.status)
  }
  const data = await res.json()
  return (data.items || []).map(normalizarGoogleItem)
}

export async function buscarOpenLibrary(q, { signal } = {}) {
  const qIsbn = /[\dXx-]{10,}/.test(q) ? normIsbn(q) : ''
  if (qIsbn) {
    // tenta ISBN direto (/isbn/{isbn}.json) — mas OL às vezes retorna HTML 200, então verifica content-type
    try {
      const res = await fetch('https://openlibrary.org/isbn/' + qIsbn + '.json', { signal })
      const ctype = res.headers.get('content-type') || ''
      if (res.ok && ctype.includes('application/json')) {
        const e = await res.json()
        let descricao = ''
        let autorNomes = []
        const workKey = e.works && e.works[0] && e.works[0].key
        if (workKey) {
          try {
            const wr = await fetch('https://openlibrary.org' + workKey + '.json', { signal })
            if (wr.ok) {
              const w = await wr.json()
              const desc = w.description
              descricao = typeof desc === 'string' ? desc : (desc && desc.value) || ''
              if (w.authors && Array.isArray(w.authors) && autorNomes.length===0) {
                const authorKeys = w.authors.map(a=> a.author?.key || a.key).filter(Boolean)
                if (authorKeys.length) {
                  const reqs = authorKeys.slice(0,2).map(k=> fetch('https://openlibrary.org'+k+'.json', {signal}).then(r=>r.ok?r.json():null).catch(()=>null))
                  const authors = await Promise.all(reqs)
                  autorNomes = authors.filter(Boolean).map(a=> a.name || a.personal_name).filter(Boolean)
                }
              }
            }
          } catch (_) { /* ignora */ }
        }
        if (autorNomes.length===0 && e.authors && Array.isArray(e.authors)) {
          try {
            const keys = e.authors.map(a=> a.key).filter(Boolean).slice(0,2)
            if (keys.length) {
              const reqs = keys.map(k=> fetch('https://openlibrary.org'+k+'.json', {signal}).then(r=>r.ok?r.json():null).catch(()=>null))
              const authors = await Promise.all(reqs)
              autorNomes = authors.filter(Boolean).map(a=> a.name || a.personal_name).filter(Boolean)
            }
          } catch {}
        }
        const autor = autorNomes.length ? autorNomes.join(', ') : (e.by_statement ? e.by_statement.replace(/^por\s+/i,'').replace(/;.*$/,'').trim() : '')
        const lang = (e.languages || []).map((l) => (l.key || '').replace('/languages/', '')).join(',') || 'por'
        const ano = extrairAno(e.publish_date || e.created?.value || '')
        return [{
          titulo: e.title || '',
          autor,
          editora: (e.publishers || [])[0] || '',
          ano,
          isbn: qIsbn,
          paginas: e.number_of_pages ? String(e.number_of_pages) : '',
          capa: 'https://covers.openlibrary.org/b/isbn/' + qIsbn + '-M.jpg',
          descricao,
          idioma: lang,
          link: workKey ? 'https://openlibrary.org' + workKey : 'https://openlibrary.org/isbn/'+qIsbn,
          edition_count: 0,
          fonte: 'Open Library'
        }]
      }
    } catch (e) {
      if (e.name==='AbortError') throw e
      console.warn('[api] OL isbn direto falhou, tentando search', e.message)
    }
    // fallback: busca via search.json?q=isbn (mais confiável que /isbn/{id}.json)
    try {
      const sRes = await fetch('https://openlibrary.org/search.json?q=' + qIsbn + '&limit=5', { signal })
      if (sRes.ok) {
        const sData = await sRes.json()
        if (sData.docs && sData.docs.length) {
          const doc = sData.docs.find(d=> (d.isbn||[]).some(is=> normIsbn(is)===qIsbn)) || sData.docs[0]
          const norm = normalizarOLDoc(doc)
          // tenta enriquecer com edition se faltar editora/paginas
          const editionKey = doc.cover_edition_key || doc.lending_edition_s || (doc.edition_key && doc.edition_key[0])
          if (editionKey && (!norm.paginas || !norm.editora)) {
            try {
              const er = await fetch('https://openlibrary.org/books/' + editionKey + '.json', { signal })
              if (er.ok) {
                const ed = await er.json()
                norm.editora = norm.editora || (ed.publishers && ed.publishers[0]) || ''
                norm.paginas = norm.paginas || (ed.number_of_pages ? String(ed.number_of_pages) : '')
                norm.ano = norm.ano || extrairAno(ed.publish_date)
              }
            } catch {}
          }
          norm.isbn = qIsbn
          norm.capa = norm.capa || 'https://covers.openlibrary.org/b/isbn/' + qIsbn + '-M.jpg'
          norm.fonte = 'Open Library'
          return [norm]
        }
      }
    } catch (e) {
      if (e.name==='AbortError') throw e
    }
    return []
  }
  const url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=10&language=por'
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Open Library HTTP ' + res.status)
  const data = await res.json()
  const docs = (data.docs || []).map(normalizarOLDoc)
  // Enriquecimento com /books/{key}.json temporariamente desabilitado para evitar rate-limit da OL
  // (OL bloqueou IP após muitas requisições rápidas). Publisher/paginas extras virão do Google quando disponível,
  // ou do fallback de search. Reativar quando OL liberar.
  // for (let i=0;i<Math.min(1, docs.length); i++) { ... }
  return docs
}

// ---------- API principal: sequencial com fallback (economiza quota) ----------
export async function buscarLivros(q, { signal, forceGoogle = false } = {}) {
  const termo = (q || '').trim()
  if (!termo) throw new Error('Digite um termo para buscar')

  // cache unificado: chave normalizada (ISBN sem formatação), sem duplicação :force
  const cached = getCached(termo)
  if (cached) {
    if (import.meta.env.DEV) console.debug('[api] cache hit', termo, 'chave', chaveCache(termo))
    return cached
  }

  // detecção ISBN: sempre tenta OL ISBN direto, depois Google
  const isIsbn = isIsbnQuery(termo)

  // Estratégia 1: ISBN -> tenta ambos em paralelo e mescla (corrige autor vazio OL)
  if (isIsbn) {
    const [olRes, gbRes] = await Promise.allSettled([
      buscarOpenLibrary(termo, { signal }),
      buscarGoogleBooks(termo, { signal })
    ])
    const ol = olRes.status==='fulfilled' ? olRes.value : []
    const gb = gbRes.status==='fulfilled' ? gbRes.value : []
    const livros = []
    const fontes = []
    // prioriza OL mas enriquece com Google se faltar autor/ano/paginas
    if (ol.length) {
      const base = { ...ol[0] }
      // se OL veio sem autor/ano/paginas, complementa com Google
      if ((!base.autor || !base.ano || !base.paginas) && gb.length) {
        const g = gb.find(x=> normIsbn(x.isbn)===normIsbn(termo)) || gb[0]
        if (g) {
          base.autor = base.autor || g.autor
          base.editora = base.editora || g.editora
          base.ano = base.ano || g.ano
          base.paginas = base.paginas || g.paginas
          base.descricao = base.descricao || g.descricao
          base.capa = base.capa || g.capa
        }
      }
      livros.push(base)
      fontes.push('Open Library')
      // adiciona google extras se tiver mais
      if (gb.length) {
        // evita duplicado exato
        const extras = gb.filter(g=> g.titulo && g.titulo.toLowerCase()!==base.titulo.toLowerCase())
        livros.push(...extras)
        if (extras.length) fontes.push('Google Books')
      }
    } else if (gb.length) {
      livros.push(...gb)
      fontes.push('Google Books')
    }
    if (livros.length===0) {
      // fallback seed local para apresentação offline
      const seed = buscarSeed(termo)
      if (seed.length) {
        const result = { livros: seed, fonte: 'Seed Local (offline)' }
        setCached(termo, result)
        return result
      }
      const errs = [olRes, gbRes].filter(r=>r.status==='rejected').map(r=>r.reason.message)
      throw new Error('Nenhum resultado para ISBN: ' + errs.join(' · '))
    }
    // enriquece com seed se OL/Google vieram incompletos (ex: 9788535902556 sem autor)
    const livrosEnriquecidos = enriquecerComSeed(livros, termo)
    const houveEnriquecimento = livrosEnriquecidos.some((l,i)=> !livros[i].autor && l.autor)
    const result = { livros: livrosEnriquecidos, fonte: fontes.join(' + ') + (houveEnriquecimento ? ' + Seed Local' : '') }
    setCached(termo, result)
    return result
  }

  // Estratégia 2: busca textual -> OL primeiro, Google só se necessário
  // Se forceGoogle (aba Buscar), faz paralelo; senão sequencial econômico
  // Cache unificado: mesma chave para ambos os modos, evita duplicação
  if (forceGoogle) {
    const [gb, ol] = await Promise.allSettled([
      buscarGoogleBooks(termo, { signal }),
      buscarOpenLibrary(termo, { signal })
    ])
    const livros = []
    const fontes = []
    if (gb.status === 'fulfilled') { livros.push(...gb.value); fontes.push('Google Books') }
    if (ol.status === 'fulfilled') { livros.push(...ol.value); fontes.push('Open Library') }
    if (livros.length === 0) {
      const seed = buscarSeed(termo)
      if (seed.length) {
        const result = { livros: seed, fonte: 'Seed Local (offline)' }
        setCached(termo, result)
        return result
      }
      const erros = [gb, ol].map(r => r.status === 'rejected' ? r.reason.message : null).filter(Boolean)
      const isRate = erros.some(m => m.includes('429'))
      throw new Error(isRate ? 'Muitas buscas seguidas — aguarde 1 minuto.' : 'Nenhum resultado: ' + erros.join(' · '))
    }
    const livrosEnriquecidos = enriquecerComSeed(livros, termo)
    const houveEnriquecimento = livrosEnriquecidos.some((l,i)=> !livros[i].autor && l.autor)
    const result = { livros: livrosEnriquecidos, fonte: fontes.join(' + ') + (houveEnriquecimento ? ' + Seed Local' : '') }
    setCached(termo, result)
    return result
  }

  // modo econômico (auto-preenchimento): OL primeiro, com seed como fallback/enriquecimento
  try {
    const ol = await buscarOpenLibrary(termo, { signal })
    const olEnriquecido = enriquecerComSeed(ol, termo)
    const temPT = olEnriquecido.some(l => l.idioma === 'por' || l.idioma === 'pt' || l.idioma.startsWith('pt'))
    if (olEnriquecido.length > 0 && (temPT || olEnriquecido.length >= 3)) {
      const houve = olEnriquecido.some((l,i)=> !ol[i]?.autor && l.autor)
      const result = { livros: olEnriquecido, fonte: 'Open Library' + (houve ? ' + Seed Local' : '') }
      setCached(termo, result)
      return result
    }
    if (olEnriquecido.length > 0) {
      try {
        const gb = await buscarGoogleBooks(termo, { signal })
        const livros = [...olEnriquecido, ...gb]
        const livrosFinal = enriquecerComSeed(livros, termo)
        const result = { livros: livrosFinal, fonte: 'Open Library + Google Books' + (livrosFinal.length!==livros.length ? ' + Seed Local' : '') }
        setCached(termo, result)
        return result
      } catch {
        const result = { livros: olEnriquecido, fonte: 'Open Library' + (olEnriquecido!==ol ? ' + Seed Local' : '') }
        setCached(termo, result)
        return result
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e
    console.warn('[api] OL falhou, tentando Google', e.message)
  }

  // fallback final: Google, depois Seed
  try {
    const gb = await buscarGoogleBooks(termo, { signal })
    const gbEnriquecido = enriquecerComSeed(gb, termo)
    const result = { livros: gbEnriquecido, fonte: 'Google Books' + (gbEnriquecido!==gb ? ' + Seed Local' : '') }
    setCached(termo, result)
    return result
  } catch (e) {
    if (e.name === 'AbortError') throw e
    // último fallback: seed local (offline) para apresentação
    const seed = buscarSeed(termo)
    if (seed.length) {
      const result = { livros: seed, fonte: 'Seed Local (offline)' }
      setCached(termo, result)
      return result
    }
    if (e.message.includes('429')) throw new Error('Muitas buscas seguidas — aguarde 1 minuto e tente novamente.')
    throw new Error('Busca falhou: ' + e.message)
  }
}

// Para compatibilidade com código antigo que chamava buscarLivros(q, autor)
export async function buscarLivrosComAutor(q, autor, opts) {
  const termo = autor ? `${q} ${autor}` : q
  return buscarLivros(termo, opts)
}

export function jaNoAcervo(livro, livros) {
  if (!livro?.isbn) return false
  return livros.some(l => l.isbn === livro.isbn)
}
