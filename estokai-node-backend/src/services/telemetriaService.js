import prisma from "../lib/prisma.js"
import { emitTelemetryChanged } from "../lib/socket.js"
import { shouldEmitTelemetry } from "./telemetriaRealtimeState.js"
import { notificarPresencaForaDoHorario } from "./notificacaoService.js"

function normalizeSensorType(sensorType) {
  return String(sensorType ?? "").toUpperCase()
}

function parseDate(value) {
  if (typeof value === "number") {
    const milliseconds = value < 1000000000000 ? value * 1000 : value
    return new Date(milliseconds)
  }

  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) {
    const numericValue = Number(value)
    const milliseconds = numericValue < 1000000000000 ? numericValue * 1000 : numericValue
    return new Date(milliseconds)
  }

  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

async function resolveTelemetryUserId(deviceId, sensorType) {
  if (sensorType === "WEIGHT") {
    const produto = await prisma.produto.findFirst({
      where: { balancaId: deviceId },
      select: { usuarioId: true },
    })
    if (produto) return produto.usuarioId
  }

  const dispositivo = await prisma.dispositivoTelemetria.findUnique({
    where: { deviceId },
    select: { usuarioId: true },
  })
  return dispositivo?.usuarioId ?? null
}

export async function processTelemetryMessage(message) {
  const payload = JSON.parse(message.content.toString("utf8"))
  const sensorType = normalizeSensorType(payload.sensorType)
  const usuarioId = await resolveTelemetryUserId(payload.deviceId, sensorType)

  const leituraAnterior = sensorType === "MOTION"
    ? await prisma.telemetria.findFirst({
      where: { deviceId: payload.deviceId, sensorType, usuarioId },
      orderBy: { measuredAt: "desc" },
      select: { value: true },
    })
    : null

  const reading = await prisma.telemetria.create({
    data: {
      deviceId: payload.deviceId,
      sensorType,
      value: Number(payload.value),
      unit: payload.unit,
      measuredAt: parseDate(payload.measuredAt),
      receivedAt: parseDate(payload.receivedAt),
      usuarioId,
    },
  })

  if (shouldEmitTelemetry(reading)) {
    emitTelemetryChanged(reading)
  }

  const haviaPresenca = Number(leituraAnterior?.value ?? 0) > 0
  const haPresenca = sensorType === "MOTION" && Number(reading.value) > 0
  if (usuarioId && haPresenca && !haviaPresenca) {
    await notificarPresencaForaDoHorario(usuarioId, reading)
  }

  return reading
}

export async function getLatestTelemetryReadings(usuarioId) {
  const readings = await prisma.telemetria.findMany({
    where: { usuarioId },
    orderBy: {
      measuredAt: "desc",
    },
    take: 200,
  })

  return Object.values(readings.reduce((latest, reading) => {
    const key = `${reading.deviceId}:${reading.sensorType}`

    if (!latest[key]) {
      latest[key] = reading
    }

    return latest
  }, {}))
}

export async function getTelemetryDevice(usuarioId) {
  return prisma.dispositivoTelemetria.findFirst({
    where: { usuarioId },
    select: { deviceId: true },
    orderBy: { updatedAt: "desc" },
  })
}

export async function updateTelemetryDevice(usuarioId, deviceId) {
  const normalizedDeviceId = String(deviceId ?? "").trim()
  if (!normalizedDeviceId) {
    const error = new Error("Informe o ID do dispositivo IoT")
    error.status = 400
    throw error
  }

  const dispositivoEmUso = await prisma.dispositivoTelemetria.findUnique({ where: { deviceId: normalizedDeviceId } })
  if (dispositivoEmUso && dispositivoEmUso.usuarioId !== usuarioId) {
    const error = new Error("Este dispositivo já está vinculado a outro usuário")
    error.status = 409
    throw error
  }

  const balancaDeOutroUsuario = await prisma.produto.findFirst({
    where: { balancaId: normalizedDeviceId, usuarioId: { not: usuarioId } },
    select: { id: true },
  })
  if (balancaDeOutroUsuario) {
    const error = new Error("Este dispositivo já está vinculado a outro usuário")
    error.status = 409
    throw error
  }

  await prisma.$transaction([
    prisma.dispositivoTelemetria.deleteMany({ where: { usuarioId, deviceId: { not: normalizedDeviceId } } }),
    prisma.dispositivoTelemetria.upsert({
      where: { deviceId: normalizedDeviceId },
      create: { deviceId: normalizedDeviceId, usuarioId },
      update: { usuarioId },
    }),
  ])

  return { deviceId: normalizedDeviceId }
}

function convertWeightToKg(value, unit) {
  const normalizedUnit = String(unit ?? "kg").trim().toLowerCase()

  if (normalizedUnit === "g" || normalizedUnit === "grama" || normalizedUnit === "gramas") return value / 1000
  if (normalizedUnit === "mg") return value / 1000000
  if (normalizedUnit === "lb" || normalizedUnit === "lbs") return value * 0.45359237
  return value
}

function calcularAssimetria(valores, media, desvioPadrao) {
  // O coeficiente de assimetria pelo terceiro momento padronizado só é útil com ao menos três observações
  // distintas. Para uma ou duas balanças (ou pesos idênticos), ela é indefinida.
  if (valores.length < 3 || desvioPadrao === 0) return null

  const somaCubosPadronizados = valores.reduce(
    (soma, valor) => soma + ((valor - media) / desvioPadrao) ** 3,
    0,
  )

  return somaCubosPadronizados / valores.length
}

export async function getScaleWeightSummary(usuarioId) {
  const produtos = await prisma.produto.findMany({
    where: { usuarioId, balancaId: { not: null } },
    select: { id: true, descricao: true, balancaId: true },
  })
  const balancaIds = [...new Set(produtos.map((produto) => produto.balancaId).filter(Boolean))]

  if (balancaIds.length === 0) {
    return {
      totalKg: 0,
      mediaKg: 0,
      desvioPadraoKg: null,
      assimetria: null,
      balancasConfiguradas: 0,
      balancasComLeitura: 0,
    }
  }

  const leituras = await prisma.telemetria.findMany({
    where: { usuarioId, sensorType: "WEIGHT", deviceId: { in: balancaIds } },
    orderBy: { measuredAt: "desc" },
  })
  const ultimaLeituraPorBalanca = new Map()
  for (const leitura of leituras) {
    if (!ultimaLeituraPorBalanca.has(leitura.deviceId)) {
      ultimaLeituraPorBalanca.set(leitura.deviceId, leitura)
    }
  }

  const pesosKg = [...ultimaLeituraPorBalanca.values()]
    .map((leitura) => convertWeightToKg(Number(leitura.value), leitura.unit))
    .filter(Number.isFinite)
  const totalKg = pesosKg.reduce((total, peso) => total + peso, 0)
  const mediaKg = pesosKg.length ? totalKg / pesosKg.length : 0
  const desvioPadraoKg = pesosKg.length >= 2
    ? Math.sqrt(pesosKg.reduce((soma, peso) => soma + (peso - mediaKg) ** 2, 0) / pesosKg.length)
    : null
  const assimetria = desvioPadraoKg === null
    ? null
    : calcularAssimetria(pesosKg, mediaKg, desvioPadraoKg)

  return {
    totalKg,
    mediaKg,
    desvioPadraoKg,
    assimetria,
    balancasConfiguradas: balancaIds.length,
    balancasComLeitura: pesosKg.length,
  }
}

function validarHorario(valor) {
  return typeof valor === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor)
}

export async function getBusinessHours(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { horarioInicio: true, horarioFim: true, temperaturaVentilador: true, ventiladorLigado: true },
  })

  return {
    horarioInicio: usuario?.horarioInicio ?? "08:00",
    horarioFim: usuario?.horarioFim ?? "18:00",
    temperaturaVentilador: usuario?.temperaturaVentilador ?? 30,
    ventiladorLigado: usuario?.ventiladorLigado ?? false,
  }
}

export async function updateBusinessHours(usuarioId, { horarioInicio, horarioFim, temperaturaVentilador }) {
  if (!validarHorario(horarioInicio) || !validarHorario(horarioFim) || horarioInicio === horarioFim) {
    const error = new Error("Informe horários válidos e diferentes")
    error.status = 400
    throw error
  }
  const limiteVentilador = Number(temperaturaVentilador)
  if (!Number.isFinite(limiteVentilador) || limiteVentilador <= 0 || limiteVentilador > 100) {
    const error = new Error("Informe uma temperatura válida para o ventilador")
    error.status = 400
    throw error
  }

  const configuracao = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { horarioInicio, horarioFim, temperaturaVentilador: limiteVentilador },
    select: { horarioInicio: true, horarioFim: true, temperaturaVentilador: true, ventiladorLigado: true },
  })
  // Ao alterar o limite manualmente, um alvo acima da temperatura atual
  // desliga o ventilador de imediato. A histerese vale para leituras normais.
  const ventilador = await getFanStatus(usuarioId, { reavaliarLimite: true })

  return { ...configuracao, ventiladorLigado: ventilador.ligado, limiteDesligamento: ventilador.limiteDesligamento }
}

async function getFanStatus(usuarioId, { reavaliarLimite = false } = {}) {
  const [usuario, temperatura] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { temperaturaVentilador: true, ventiladorLigado: true },
    }),
    prisma.telemetria.findFirst({
      where: { usuarioId, sensorType: "TEMPERATURE" },
      orderBy: { measuredAt: "desc" },
      select: { value: true, unit: true, measuredAt: true },
    }),
  ])

  const limite = usuario?.temperaturaVentilador ?? 30
  const limiteDesligamento = limite - 5
  const valorAtual = Number(temperatura?.value)
  let ventiladorLigado = usuario?.ventiladorLigado ?? false

  if (Number.isFinite(valorAtual)) {
    if (valorAtual >= limite) ventiladorLigado = true
    if (valorAtual <= limiteDesligamento || (reavaliarLimite && valorAtual < limite)) {
      ventiladorLigado = false
    }
  }

  if (usuario && ventiladorLigado !== usuario.ventiladorLigado) {
    await prisma.usuario.update({ where: { id: usuarioId }, data: { ventiladorLigado } })
  }

  return { ligado: ventiladorLigado, limite, limiteDesligamento, temperaturaAtual: Number.isFinite(valorAtual) ? valorAtual : null }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function buildBuckets(visualizacao) {
  const now = new Date()

  if (visualizacao === "Semana") {
    const start = addDays(startOfDay(now), -6)
    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = addDays(start, index)
      const bucketEnd = addDays(bucketStart, 1)

      return {
        key: bucketStart.toISOString().slice(0, 10),
        label: formatarLabelPrevisao(bucketStart, visualizacao),
        start: bucketStart,
        end: bucketEnd,
      }
    })
  }

  if (visualizacao === "Mes") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const totalDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000))

    return Array.from({ length: totalDays }, (_, index) => {
      const bucketStart = addDays(start, index)
      const bucketEnd = addDays(bucketStart, 1)

      return {
        key: bucketStart.toISOString().slice(0, 10),
        label: String(bucketStart.getDate()),
        start: bucketStart,
        end: bucketEnd,
      }
    })
  }

  const start = startOfDay(now)
  return Array.from({ length: 24 }, (_, hour) => {
    const bucketStart = new Date(start)
    bucketStart.setHours(hour, 0, 0, 0)
    const bucketEnd = new Date(start)
    bucketEnd.setHours(hour + 1, 0, 0, 0)

    return {
      key: String(hour).padStart(2, "0"),
      label: String(hour).padStart(2, "0"),
      start: bucketStart,
      end: bucketEnd,
    }
  })
}

function findBucketIndex(buckets, date) {
  return buckets.findIndex((bucket) => date >= bucket.start && date < bucket.end)
}

function formatarLabelPrevisao(date, visualizacao) {
  if (visualizacao === "Dia") {
    return `${String(date.getHours()).padStart(2, "0")}:00`
  }

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function criarPrevisaoLinear(buckets, valores, visualizacao) {
  // Inclui o período em andamento para que compras recém-concluídas também
  // influenciem a projeção. A previsão começa no período seguinte.
  const agora = new Date()
  const amostras = buckets
    .map((bucket, indice) => ({ bucket, valor: valores[indice] }))
    .filter(({ bucket }) => bucket.start <= agora)

  // No gráfico mensal, completa os dias restantes do mês em vez de limitar a
  // previsão a uma semana. Assim, histórico e projeção ocupam todo o mês.
  const horizonte = visualizacao === "Mes"
    ? Math.max(buckets.length - amostras.length, 0)
    : visualizacao === "Dia" ? 6 : 7
  if (amostras.length < 2) {
    return {
      disponivel: false,
      metodo: "regressao_linear",
      pontosTreino: amostras.length,
      rQuadrado: null,
      correlacaoTempo: null,
      labels: [],
      valores: [],
    }
  }

  const mediaX = (amostras.length - 1) / 2
  const mediaY = amostras.reduce((soma, amostra) => soma + amostra.valor, 0) / amostras.length
  let somaDesviosX2 = 0
  let somaDesviosY2 = 0
  let somaDesviosXY = 0

  for (const [indice, amostra] of amostras.entries()) {
    const desvioX = indice - mediaX
    const desvioY = amostra.valor - mediaY
    somaDesviosX2 += desvioX ** 2
    somaDesviosY2 += desvioY ** 2
    somaDesviosXY += desvioX * desvioY
  }

  const inclinacao = somaDesviosXY / somaDesviosX2
  const intercepto = mediaY - inclinacao * mediaX
  const correlacaoTempo = somaDesviosY2 === 0
    ? null
    : somaDesviosXY / Math.sqrt(somaDesviosX2 * somaDesviosY2)
  const rQuadrado = correlacaoTempo === null ? null : correlacaoTempo ** 2
  const duracaoPeriodo = buckets[buckets.length - 1].end - buckets[buckets.length - 1].start
  const primeiroPeriodoFuturo = amostras[amostras.length - 1].bucket.end

  const labels = []
  const valoresPrevisao = []
  for (let indice = 0; indice < horizonte; indice += 1) {
    const inicio = new Date(primeiroPeriodoFuturo.getTime() + indice * duracaoPeriodo)
    labels.push(formatarLabelPrevisao(inicio, visualizacao))
    // Não há compras ou entradas negativas; limita previsões negativas a zero.
    valoresPrevisao.push(Number(Math.max(0, intercepto + inclinacao * (amostras.length + indice)).toFixed(2)))
  }

  return {
    disponivel: true,
    metodo: "regressao_linear",
    pontosTreino: amostras.length,
    rQuadrado: rQuadrado === null ? null : Number(rQuadrado.toFixed(3)),
    correlacaoTempo: correlacaoTempo === null ? null : Number(correlacaoTempo.toFixed(3)),
    labels,
    valores: valoresPrevisao,
  }
}

export async function getIotStatistics(usuarioId, visualizacao = "Dia") {
  const buckets = buildBuckets(visualizacao)
  const start = buckets[0].start
  const end = buckets[buckets.length - 1].end

  const [previousMotionReading, motionReadings, pedidos, itens, pesos, ventilador] = await Promise.all([
    prisma.telemetria.findFirst({
      where: {
        usuarioId,
        sensorType: "MOTION",
        measuredAt: {
          lt: start,
        },
      },
      orderBy: {
        measuredAt: "desc",
      },
    }),
    prisma.telemetria.findMany({
      where: {
        usuarioId,
        sensorType: "MOTION",
        measuredAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        measuredAt: "asc",
      },
    }),
    prisma.pedido.findMany({
      where: {
        usuarioId,
        status: "Concluído",
        concluidoEm: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
        concluidoEm: true,
      },
    }),
    prisma.itemPedido.findMany({
      where: {
        pedido: {
          is: {
            usuarioId,
            status: "Concluído",
            concluidoEm: {
              gte: start,
              lt: end,
            },
          },
        },
      },
      select: {
        quantidade: true,
        valorTotal: true,
        produtoId: true,
        pedido: {
          select: {
            concluidoEm: true,
          },
        },
      },
    }),
    getScaleWeightSummary(usuarioId),
    getFanStatus(usuarioId),
  ])

  const produtoIds = [...new Set(itens.map((item) => item.produtoId))]
  const produtos = produtoIds.length === 0
    ? []
    : await prisma.produto.findMany({
      where: {
        id: {
          in: produtoIds,
        },
        usuarioId,
      },
      select: {
        id: true,
        descricao: true,
        marca: true,
        imagemUrl: true,
      },
    })
  const produtosById = new Map(produtos.map((produto) => [produto.id, produto]))

  const pessoas = Array(buckets.length).fill(0)
  const compras = Array(buckets.length).fill(0)
  const vendasPorProduto = new Map()
  let previousPeopleCount = Math.max(Math.round(previousMotionReading?.value ?? 0), 0)

  for (const reading of motionReadings) {
    const index = findBucketIndex(buckets, reading.measuredAt)
    const currentPeopleCount = Math.max(Math.round(reading.value), 0)
    const entries = Math.max(currentPeopleCount - previousPeopleCount, 0)

    if (index >= 0) {
      pessoas[index] += entries
    }

    previousPeopleCount = currentPeopleCount
  }

  for (const pedido of pedidos) {
    const index = findBucketIndex(buckets, pedido.concluidoEm)

    if (index >= 0) {
      compras[index] += 1
    }
  }

  for (const item of itens) {
    const index = findBucketIndex(buckets, item.pedido.concluidoEm)
    if (index < 0) continue

    const vendas = vendasPorProduto.get(item.produtoId) ?? Array(buckets.length).fill(0)
    vendas[index] += item.quantidade
    vendasPorProduto.set(item.produtoId, vendas)
  }

  const topItensMap = itens.reduce((acc, item) => {
    const produto = produtosById.get(item.produtoId)
    const current = acc.get(item.produtoId) ?? {
      id: item.produtoId,
      nome: produto?.descricao ?? "Produto sem descricao",
      marca: produto?.marca ?? "",
      imagemUrl: produto?.imagemUrl ?? null,
      vendas: 0,
      valorTotal: 0,
    }

    current.vendas += item.quantidade
    current.valorTotal += item.valorTotal
    acc.set(item.produtoId, current)

    return acc
  }, new Map())

  const topItens = Array.from(topItensMap.values())
    .sort((a, b) => b.vendas - a.vendas)
    .slice(0, 5)

  const picoIndex = compras.reduce((bestIndex, value, index) => (
    value > compras[bestIndex] ? index : bestIndex
  ), 0)
  const previsoes = {
    compras: criarPrevisaoLinear(buckets, compras, visualizacao),
    topItens: topItens
      .map((item) => {
        const previsao = criarPrevisaoLinear(
          buckets,
          vendasPorProduto.get(item.id) ?? Array(buckets.length).fill(0),
          visualizacao,
        )
        const vendasPrevistas = previsao.disponivel
          ? Number(previsao.valores.reduce((total, valor) => total + valor, 0).toFixed(2))
          : null

        return { ...item, vendasPrevistas, previsao }
      })
      .sort((a, b) => (b.vendasPrevistas ?? -1) - (a.vendasPrevistas ?? -1)),
  }

  return {
    labels: buckets.map((bucket) => bucket.label),
    pessoas,
    compras,
    pico: picoIndex,
    topItens,
    resumo: {
      pessoasTotal: pessoas.reduce((total, value) => total + value, 0),
      comprasTotal: compras.reduce((total, value) => total + value, 0),
      itensVendidos: itens.reduce((total, item) => total + item.quantidade, 0),
    },
    pesos,
    previsoes,
    ventilador,
  }
}
