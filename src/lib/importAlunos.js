// Planejamento puro da importação de alunos do SED.
// Não grava nada e nunca exclui aluno: apenas classifica o que fazer.

export function matriculaDe(ra, digRa) {
  return `${String(ra ?? '').trim()}-${String(digRa ?? '').trim().toUpperCase()}`
}

function normalizarNome(valor) {
  return String(valor ?? '').trim().replace(/\s+/g, ' ')
}

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function estaAtivo(situacao) {
  return normalizarTexto(situacao) === 'ativo'
}

function compararNome(a, b) {
  return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt', { sensitivity: 'base' })
}

function semCamposInternos(entrada) {
  return {
    nome: entrada.nome,
    ra: entrada.ra,
    digRa: entrada.digRa,
    matricula: entrada.matricula,
    turma: entrada.turma,
    anoLetivo: entrada.anoLetivo,
    situacao: entrada.situacao,
    ativo: entrada.ativo
  }
}

/**
 * @param {Array} alunosExistentes alunos no formato do app (camelCase)
 * @param {Array<{turma:string, anoLetivo:number, alunos:Array, arquivo?:string, erros?:Array, anoLetivoArquivo?:number}>} lotes
 * @param {number|null} anoLetivoInformado ano selecionado na tela
 */
export function planejarImportacao(alunosExistentes = [], lotes = [], anoLetivoInformado = null) {
  const erros = []
  const avisos = []
  const existentes = Array.isArray(alunosExistentes) ? alunosExistentes : []

  const mapaExistentes = new Map()
  for (const aluno of existentes) {
    const chave = String(aluno?.matricula || '').trim()
    if (chave) mapaExistentes.set(chave, aluno)
  }

  const vistos = new Map()
  const duplicadas = new Set()
  const entradas = []
  const anosAvisados = new Set()

  function avisarAno(arquivo, anoArquivo, anoInformado) {
    if (anoArquivo == null || anoInformado == null) return
    const a = Number(anoArquivo)
    const b = Number(anoInformado)
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return
    const chave = `${arquivo || ''}|${a}|${b}`
    if (anosAvisados.has(chave)) return
    anosAvisados.add(chave)
    avisos.push({
      tipo: 'ano_letivo',
      arquivo: arquivo || '',
      anoLetivoArquivo: a,
      anoLetivoInformado: b,
      motivo: `O arquivo informa ${a}, mas a importação está como ${b}.`
    })
  }

  for (const lote of lotes) {
    const arquivo = lote?.arquivo || lote?.nome || ''
    const turma = String(lote?.turma || '').trim()
    const anoLetivo = Number(lote?.anoLetivo) || null

    if (!turma) erros.push({ arquivo, linha: null, motivo: 'Turma não informada para o arquivo' })
    if (!anoLetivo) erros.push({ arquivo, linha: null, motivo: 'Ano letivo não informado' })

    avisarAno(arquivo, lote?.anoLetivoArquivo, anoLetivo)
    avisarAno(arquivo, anoLetivo, anoLetivoInformado)

    for (const erro of lote?.erros || []) {
      erros.push({
        arquivo,
        linha: erro?.linha ?? null,
        motivo: erro?.motivo || 'Erro no arquivo'
      })
    }

    for (const aluno of lote?.alunos || []) {
      const nome = normalizarNome(aluno?.nome)
      const ra = String(aluno?.ra ?? '').trim()
      const digRa = String(aluno?.digRa ?? '').trim().toUpperCase()
      const situacao = String(aluno?.situacao ?? '').trim()
      const linha = aluno?.linha ?? null

      if (!nome || !ra) {
        const motivo = !nome && !ra
          ? 'Linha sem nome e sem RA'
          : (!nome ? 'Linha sem nome' : 'Linha sem RA')
        erros.push({ arquivo, linha, motivo })
        continue
      }

      const matricula = matriculaDe(ra, digRa)
      const entrada = {
        nome,
        ra,
        digRa,
        matricula,
        turma,
        anoLetivo,
        situacao,
        ativo: estaAtivo(situacao),
        arquivo,
        linha
      }

      if (vistos.has(matricula)) {
        duplicadas.add(matricula)
        const anterior = vistos.get(matricula)
        erros.push({
          arquivo,
          linha,
          matricula,
          motivo: `Matrícula ${matricula} repetida` +
            (anterior?.arquivo ? ` (já apareceu em ${anterior.arquivo})` : '')
        })
      } else {
        vistos.set(matricula, entrada)
        entradas.push(entrada)
      }
    }
  }

  const unicas = entradas.filter(e => !duplicadas.has(e.matricula))
  const novos = []
  const atualizados = []
  const semMudanca = []
  const inativarAgora = []

  for (const entrada of unicas) {
    const existente = mapaExistentes.get(entrada.matricula)

    if (!existente) {
      const item = semCamposInternos(entrada)
      novos.push(item)
      if (!entrada.ativo) {
        inativarAgora.push({ ...item, id: null, aluno: null })
      }
      continue
    }

    const mudancas = []
    const nomeAntes = normalizarNome(existente.nome)
    if (nomeAntes !== entrada.nome) {
      mudancas.push({ campo: 'nome', de: existente.nome || '', para: entrada.nome })
    }

    const turmaAntes = String(existente.turma || '').trim()
    if (turmaAntes !== entrada.turma) {
      mudancas.push({ campo: 'turma', de: turmaAntes, para: entrada.turma })
    }

    const anoAntes = existente.anoLetivo == null || existente.anoLetivo === ''
      ? null
      : Number(existente.anoLetivo)
    if (anoAntes !== entrada.anoLetivo) {
      mudancas.push({ campo: 'anoLetivo', de: anoAntes, para: entrada.anoLetivo })
    }

    const item = {
      ...semCamposInternos(entrada),
      id: existente.id,
      aluno: existente,
      mudancas
    }

    if (mudancas.length) atualizados.push(item)
    else semMudanca.push(item)

    if (!entrada.ativo) inativarAgora.push({ ...item })
  }

  const possiveisSaidas = existentes
    .filter(aluno => {
      const chave = String(aluno?.matricula || '').trim()
      return aluno?.ativo !== false && chave && !vistos.has(chave)
    })
    .sort(compararNome)

  novos.sort(compararNome)
  atualizados.sort(compararNome)
  semMudanca.sort(compararNome)
  inativarAgora.sort(compararNome)

  return {
    novos,
    atualizados,
    semMudanca,
    inativarAgora,
    possiveisSaidas,
    erros,
    avisos
  }
}
