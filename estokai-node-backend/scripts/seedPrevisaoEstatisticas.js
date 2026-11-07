import prisma from "../src/lib/prisma.js"

const PRODUTOS_DE_TESTE = ["Roda", "Cybertruck", "Nathan777"]
const MARCADOR_SEED = "SEED_PREVISAO"

function inicioDoDia(data) {
  const resultado = new Date(data)
  resultado.setHours(0, 0, 0, 0)
  return resultado
}

function dataNoHorario(diasAtras, hora) {
  const data = inicioDoDia(new Date())
  data.setDate(data.getDate() - diasAtras)
  data.setHours(hora, 0, 0, 0)
  return data
}

function itensDoPedido(produtos, indiceDia, indicePedido) {
  const [roda, cybertruck, nathan] = produtos
  const quantidades = [
    2 + indiceDia + (indicePedido % 2),
    Math.max(1, 5 - Math.floor(indiceDia / 2)),
    2 + ((indiceDia + indicePedido) % 3),
  ]

  return produtos.map((produto, indice) => {
    const quantidade = quantidades[indice]
    const valorUnitario = Number(produto.precoUnitario)

    return {
      numItem: indice + 1,
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
      produtoId: produto.id,
    }
  })
}

async function obterProdutosDoMesmoUsuario() {
  const produtos = await prisma.produto.findMany({
    where: { descricao: { in: PRODUTOS_DE_TESTE } },
    select: { id: true, descricao: true, precoUnitario: true, usuarioId: true },
  })
  const porUsuario = new Map()

  for (const produto of produtos) {
    const doUsuario = porUsuario.get(produto.usuarioId) ?? []
    doUsuario.push(produto)
    porUsuario.set(produto.usuarioId, doUsuario)
  }

  const correspondencias = [...porUsuario.entries()]
    .map(([usuarioId, produtosDoUsuario]) => ({ usuarioId, produtos: produtosDoUsuario }))
    .filter(({ produtos: produtosDoUsuario }) => (
      PRODUTOS_DE_TESTE.every((descricao) => produtosDoUsuario.some((produto) => produto.descricao === descricao))
    ))

  if (correspondencias.length !== 1) {
    throw new Error(
      "Não foi encontrado um único usuário com os produtos Roda, Cybertruck e Nathan777. "
      + "Confirme os nomes dos produtos antes de executar o seed.",
    )
  }

  const { usuarioId, produtos: produtosDoUsuario } = correspondencias[0]
  return {
    usuarioId,
    produtos: PRODUTOS_DE_TESTE.map((descricao) => (
      produtosDoUsuario.find((produto) => produto.descricao === descricao)
    )),
  }
}

async function obterClienteDeTeste(usuarioId) {
  const clienteExistente = await prisma.cliente.findFirst({
    where: { usuarioId },
    orderBy: { createdAt: "asc" },
  })

  if (clienteExistente) return clienteExistente

  return prisma.cliente.create({
    data: {
      cnpj: false,
      nomeRazaoSocial: "Cliente de teste - previsão",
      cpfCnpj: "00000000000",
      logradouro: "Rua de Teste",
      numImovel: "0",
      municipio: "São Paulo",
      uf: "SP",
      cep: "00000000",
      celular1: "00000000000",
      usuarioId,
    },
  })
}

async function main() {
  const { usuarioId, produtos } = await obterProdutosDoMesmoUsuario()
  const existentes = await prisma.pedido.count({
    where: { usuarioId, tipoDesconto: MARCADOR_SEED },
  })

  if (existentes > 0) {
    console.log(`Seed não executado: já existem ${existentes} pedido(s) de teste de previsão para este usuário.`)
    return
  }

  const cliente = await obterClienteDeTeste(usuarioId)
  const ultimoPedido = await prisma.pedido.findFirst({
    where: { usuarioId },
    orderBy: { numPedido: "desc" },
    select: { numPedido: true },
  })
  let proximoNumero = (ultimoPedido?.numPedido ?? 0) + 1
  let pedidosCriados = 0

  // Seis dias completos geram dados para as visões Semana e Mês.
  for (let indiceDia = 0; indiceDia < 6; indiceDia += 1) {
    const diasAtras = 6 - indiceDia
    const totalPedidosNoDia = 1 + Math.floor(indiceDia / 2)

    for (let indicePedido = 0; indicePedido < totalPedidosNoDia; indicePedido += 1) {
      const concluidoEm = dataNoHorario(diasAtras, 10 + indicePedido * 3)
      const itens = itensDoPedido(produtos, indiceDia, indicePedido)
      const valorTotal = itens.reduce((total, item) => total + item.valorTotal, 0)

      await prisma.pedido.create({
        data: {
          numPedido: proximoNumero,
          createdAt: concluidoEm,
          concluidoEm,
          valorTotal,
          desconto: 0,
          tipoDesconto: MARCADOR_SEED,
          formaPagamento: "Pix",
          status: "Concluído",
          usuarioId,
          clienteId: cliente.id,
          itens: { create: itens },
        },
      })

      proximoNumero += 1
      pedidosCriados += 1
    }
  }

  // Cria ao menos três períodos já encerrados hoje para testar a visão Dia.
  const horaAtual = new Date().getHours()
  const horariosDeHoje = [horaAtual - 6, horaAtual - 4, horaAtual - 2].filter((hora) => hora >= 0)

  for (const [indicePedido, hora] of horariosDeHoje.entries()) {
    const concluidoEm = dataNoHorario(0, hora)
    const itens = itensDoPedido(produtos, 6, indicePedido)
    const valorTotal = itens.reduce((total, item) => total + item.valorTotal, 0)

    await prisma.pedido.create({
      data: {
        numPedido: proximoNumero,
        createdAt: concluidoEm,
        concluidoEm,
        valorTotal,
        desconto: 0,
        tipoDesconto: MARCADOR_SEED,
        formaPagamento: "Pix",
        status: "Concluído",
        usuarioId,
        clienteId: cliente.id,
        itens: { create: itens },
      },
    })

    proximoNumero += 1
    pedidosCriados += 1
  }

  console.log(`${pedidosCriados} pedidos de teste criados para a previsão.`)
  console.log("Abra Estatísticas e use Hoje, Semana ou Mês para visualizar as linhas de previsão.")
}

main()
  .catch((error) => {
    console.error("Falha ao criar dados de teste para previsão:", error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
