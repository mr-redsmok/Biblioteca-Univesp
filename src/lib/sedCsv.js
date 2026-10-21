// Parser do CSV exportado pelo SED.
//
// Formato esperado: Windows-1252, separador ';', quebra CRLF e um preâmbulo
// antes do cabeçalho. O cabeçalho é localizado pela coluna "Nome do Aluno",
// nunca por posição fixa.
//
// Privacidade: as colunas de e-mail e data de nascimento são deliberadamente
// ignoradas. O resultado nunca as contém, nem as registra em log.

const COLUNAS = {
  nome: ['nome do aluno', 'nome'],
  ra: ['ra', 'ra do aluno'],
  digRa: ['dig ra', 'dig do ra', 'digito ra', 'digito do ra', 'digito'],
  situacao: ['situacao do aluno', 'situacao']
}

function normalizar(valor) {
  return String(valor ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizarNome(valor) {
  return String(valor ?? '').trim().replace(/\s+/g, ' ')
}

// Divide uma linha CSV respeitando campos entre aspas e aspas escapadas ("").
function dividirLinha(linha, separador = ';') {
  const celulas = []
  let atual = ''
  let entreAspas = false

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (entreAspas) {
      if (c === '"') {
        if (linha[i + 1] === '"') {
          atual += '"'
          i++
        } else {
          entreAspas = false
        }
      } else {
        atual += c
      }
    } else if (c === '"') {
      entreAspas = true
    } else if (c === separador) {
      celulas.push(atual)
      atual = ''
    } else {
      atual += c
    }
  }

  celulas.push(atual)
  return celulas.map(c => c.trim())
}

function acharIndice(cabecalho, aceitos) {
  for (const aceito of aceitos) {
    const idx = cabecalho.indexOf(aceito)
    if (idx >= 0) return idx
  }
  return -1
}

function lerAnoLetivo(linhas, fimCabecalho) {
  for (let i = 0; i < fimCabecalho; i++) {
    const celulas = dividirLinha(linhas[i])
    for (let j = 0; j < celulas.length; j++) {
      if (!normalizar(celulas[j]).includes('ano letivo')) continue
      // Aceita tanto "Ano Letivo;2026" quanto "Ano Letivo: 2026".
      for (const fonte of [celulas[j + 1], celulas[j]]) {
        const achado = String(fonte || '').match(/\b(19|20|21)\d{2}\b/)
        if (achado) return Number(achado[0])
      }
    }
  }
  return null
}

/**
 * Converte o ArrayBuffer de um CSV do SED em dados de alunos.
 *
 * @param {ArrayBuffer|Uint8Array} arrayBuffer
 * @returns {{ anoLetivo: number|null, alunos: Array<{nome:string, ra:string, digRa:string, situacao:string}>, erros: Array<{linha:number, motivo:string}> }}
 */
export function parseSedCsv(arrayBuffer) {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer)
  const texto = new TextDecoder('windows-1252').decode(bytes)
  const linhas = texto.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/)

  const idxCabecalho = linhas.findIndex(linha => {
    const celulas = dividirLinha(linha).map(normalizar)
    return celulas.some(c => c.includes('nome do aluno'))
  })

  const anoLetivo = lerAnoLetivo(linhas, idxCabecalho === -1 ? linhas.length : idxCabecalho)

  if (idxCabecalho === -1) {
    return {
      anoLetivo,
      alunos: [],
      erros: [{ linha: 0, motivo: 'Cabeçalho com "Nome do Aluno" não encontrado' }]
    }
  }

  const cabecalho = dividirLinha(linhas[idxCabecalho]).map(normalizar)

  const indices = {
    nome: acharIndice(cabecalho, COLUNAS.nome),
    ra: acharIndice(cabecalho, COLUNAS.ra),
    digRa: acharIndice(cabecalho, COLUNAS.digRa),
    situacao: acharIndice(cabecalho, COLUNAS.situacao)
  }

  const faltando = []
  if (indices.nome < 0) faltando.push('Nome do Aluno')
  if (indices.ra < 0) faltando.push('RA')
  if (indices.digRa < 0) faltando.push('Dig. RA')
  if (indices.situacao < 0) faltando.push('Situação do Aluno')

  if (faltando.length) {
    return {
      anoLetivo,
      alunos: [],
      erros: [{
        linha: idxCabecalho + 1,
        motivo: 'Coluna(s) obrigatória(s) não encontrada(s): ' + faltando.join(', ')
      }]
    }
  }

  const alunos = []
  const erros = []

  for (let i = idxCabecalho + 1; i < linhas.length; i++) {
    const bruta = linhas[i]
    if (!bruta.trim()) continue

    const celulas = dividirLinha(bruta)
    if (celulas.every(c => !c)) continue

    const nome = normalizarNome(celulas[indices.nome])
    const ra = String(celulas[indices.ra] ?? '').trim()
    const digRa = String(celulas[indices.digRa] ?? '').trim().toUpperCase()
    const situacao = String(celulas[indices.situacao] ?? '').trim()

    if (!nome && !ra) {
      erros.push({ linha: i + 1, motivo: 'Linha sem nome e sem RA' })
      continue
    }
    if (!nome) {
      erros.push({ linha: i + 1, motivo: 'Linha sem nome' })
      continue
    }
    if (!ra) {
      erros.push({ linha: i + 1, motivo: 'Linha sem RA' })
      continue
    }

    alunos.push({ nome, ra, digRa, situacao })
  }

  return { anoLetivo, alunos, erros }
}
