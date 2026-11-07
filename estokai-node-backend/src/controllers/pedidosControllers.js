import prisma from '../lib/prisma.js'
import { registrarSaida, atualizarSaida, cancelarSaida } from '../services/movimentacaoService.js'
import { emitDataChange } from '../lib/socket.js'
import { notificarEstoqueBaixo } from '../services/notificacaoService.js'

export const retrieveAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 8 
    const search = req.query.search || ""
    const skip = (page - 1) * limit

    const whereCondition = {
      usuarioId: req.usuario.id
    }

    // Regra de busca dinâmica
    if (search) {
      const searchNum = parseInt(search.replace(/\D/g, ''))

      whereCondition.OR = [
        // Busca pelo nome do cliente
        { cliente: { nomeRazaoSocial: { contains: search, mode: 'insensitive' } } }
      ]

      // Se o usuário digitou algum número, adiciona a busca pelo numPedido
      if (!isNaN(searchNum)) {
        whereCondition.OR.push({ numPedido: searchNum })
      }
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where: whereCondition,
        include: {
          cliente: {
            select: { id: true, nomeRazaoSocial: true, cpfCnpj: true }
          },
          itens: {
            select: {
              id: true, numItem: true, quantidade: true, valorUnitario: true, valorTotal: true, produtoId: true,
              produto: { select: { id: true, descricao: true, marca: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.pedido.count({
        where: whereCondition 
      })
    ])

    res.json({
      data: pedidos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const update = async (req, res) => {
  try {
    const { id } = req.params
    const {
      status,
      formaPagamento,
      desconto,
      tipoDesconto,
    } = req.body
    
    const pedido = await prisma.pedido.findFirst({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      include: {
        itens: true
      }
    })
    
    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado"
      })
    }
    
    // DEVOLVER ESTOQUE AO CANCELAR
    if (
      status === "Cancelado" &&
      pedido.status !== "Cancelado"
    ) {
      for (const item of pedido.itens) {
        const produto =
          await prisma.produto.findUnique({
            where: {
              id: item.produtoId
            }
          })
        await prisma.produto.update({
          where: {
            id: item.produtoId
          },
          data: {
            qtdEstoque:
              produto.qtdEstoque + item.quantidade
          }
        })
        // REGISTRA MOVIMENTAÇÃO
        await prisma.movimentacao.create({
          data: {
            justificativa:
              "Cancelamento do pedido",

            quantidade:
              item.quantidade,

            produtoId:
              item.produtoId,

            itemPedidoId:
              item.id,

            usuarioId:
              req.usuario.id
          }
        })
      }
    }

    // === LÓGICA DO CARIMBO DE DATA DE CONCLUSÃO ===
    const dadosAtualizacao = {
      status,
      formaPagamento,
      desconto: desconto != null ? Number(desconto) : pedido.desconto ?? 0,
      tipoDesconto: tipoDesconto ?? pedido.tipoDesconto ?? null,
    }

    // Se o status está mudando para Concluído agora, grava a data atual
    if (status === "Concluído" && pedido.status !== "Concluído") {
      dadosAtualizacao.concluidoEm = new Date()
    } 
    // Se o status for alterado para qualquer outra coisa (ex: voltou para Pendente), remove a data
    else if (status !== "Concluído") {
      dadosAtualizacao.concluidoEm = null
    }

    const pedidoAtualizado =
      await prisma.pedido.update({
        where: {
          id
        },
        data: dadosAtualizacao // Passa o objeto tratado dinamicamente
      })
    emitDataChange(req.usuario.id, ["pedidos", "produtos", "movimentacoes", "dashboard"], "pedido_atualizado")
      
    return res.json(pedidoAtualizado)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: "Erro ao atualizar pedido"
    })
  }
}
export const create = async (req, res) => {
  try {
    const { formaPagamento, clienteId, desconto = 0, tipoDesconto = null } = req.body
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        usuarioId: req.usuario.id
      }
    })
    if (!cliente) {
      return res.status(404).json({
        error: "Cliente não encontrado"
      })
    }
    // busca último pedido
    const ultimoPedido = await prisma.pedido.findFirst({
      where: {
        usuarioId: req.usuario.id
      },
      orderBy: {
        numPedido: "desc"
      }
    })
    const proximoNumero = ultimoPedido
      ? ultimoPedido.numPedido + 1
      : 1
    const pedido = await prisma.pedido.create({
      data: {
        numPedido: proximoNumero,
        formaPagamento,
        desconto: Number(desconto) || 0,
        tipoDesconto,
        clienteId,
        valorTotal: 0,
        usuarioId: req.usuario.id,
        status: "Pendente"
      }
    })
    emitDataChange(req.usuario.id, ["pedidos", "dashboard"], "pedido_criado")
    res.json(pedido)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message
    })
  }
}

export const retrieveOne = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({
        erro: "O id do pedido é obrigatório!"
      })
    }
    const pedido = await prisma.pedido.findFirst({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true
          }
        }
      }
    })
    res.json(pedido)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message
    })
  }
}
// ira ser usado caso criado algum pedido errado, nao deve-se deletar pedidos,
export const deletePedido = async (req, res) => {
  try {
    const { id } = req.params
    const { justificativa } = req.body
    if (!id) {
      return res.status(400).json({ erro: "O id do pedido é obrigatório!" })
    }
    const pedidoExiste = await prisma.pedido.findFirst({
      where: { id, usuarioId: req.usuario.id }
    })
    if (!pedidoExiste) {
      return res.status(404).json({ error: "Pedido não encontrado" })
    }
    // transacao atomica para deletar um pedido
    await prisma.$transaction(async (tx) => {
      const itens = await tx.itemPedido.findMany({
        where: { pedidoId: id }
      })

      for (const item of itens) {
        const produto = await tx.produto.findFirst({
          where: {
            id: item.produtoId,
            usuarioId: req.usuario.id
          }
        })
        if (!produto) {
          throw new Error("Produto não encontrado")
        }
        //cancelamento das baixas no produto
        await cancelarSaida(
          tx,
          item.produtoId,
          item.quantidade,
          item.id,
          justificativa,
          req.usuario.id
        )
      }
      // deleta todos itenspedidos do pedido
      await tx.itemPedido.deleteMany({
        where: { pedidoId: id }
      })
      // deleta o pedido
      await tx.pedido.delete({
        where: { id }
      })
    })
    emitDataChange(req.usuario.id, ["pedidos", "produtos", "movimentacoes", "dashboard"], "pedido_removido")
    res.json({
      message: "Pedido removido com sucesso"
    })
  } catch (error) {
    if (error?.code === 'P2025') {
      res.status(404).end()
    } else {
      console.error(error)
      res.status(500).send(error)
    }
  }
}

export const createItemPedido = async (req, res) => {
  try {
    const { numItem, quantidade, pedidoId, produtoId, justificativa, valorUnitario: valorUnitarioBody } = req.body

    const pedido = await prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        usuarioId: req.usuario.id
      }
    })
    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" })
    }

    const justificativaMovimentacao = pedido.formaPagamento === "Distribuição"
      ? "Distribuição de produto"
      : justificativa

    const produto = await prisma.produto.findFirst({
      where: {
        id: produtoId,
        usuarioId: req.usuario.id
      }
    })
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" })
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const valorUnitario = valorUnitarioBody != null ? Number(valorUnitarioBody) : Number(produto.precoUnitario)
      const valorTotal = quantidade * valorUnitario

      const itemPedido = await tx.itemPedido.create({
        data: {
          numItem,
          quantidade,
          valorUnitario,
          valorTotal,
          pedidoId,
          produtoId,
        }
      })

      const alertaEstoque = await registrarSaida(
        tx,
        produtoId,
        quantidade,
        itemPedido.id,
        justificativaMovimentacao,
        req.usuario.id
      )

      const soma = await tx.itemPedido.aggregate({
        where: { pedidoId },
        _sum: { valorTotal: true }
      })

      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          valorTotal: soma._sum.valorTotal || 0
        }
      })

      return { itemPedido, alertaEstoque }
    })

    if (resultado.alertaEstoque.deveNotificarEstoqueBaixo) {
      await notificarEstoqueBaixo(req.usuario.id, resultado.alertaEstoque.produto)
    }
    emitDataChange(req.usuario.id, ["pedidos", "produtos", "movimentacoes", "dashboard"], "item_pedido_criado")
    res.json(resultado.itemPedido)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const updateItemPedido = async (req, res) => {
  try {
    const { id } = req.params
    const { numItem, quantidade, pedidoId, produtoId, justificativa, valorUnitario: valorUnitarioBody } = req.body
    const pedido = await prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        usuarioId: req.usuario.id
      }
    })
    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado" })
    }

    const justificativaMovimentacao = pedido.formaPagamento === "Distribuição"
      ? "Distribuição de produto"
      : justificativa
    const produto = await prisma.produto.findFirst({
      where: {
        id: produtoId,
        usuarioId: req.usuario.id
      }
    })
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" })
    }
    const resultado = await prisma.$transaction(async (tx) => {
      const valorUnitario = valorUnitarioBody != null && Number.isFinite(Number(valorUnitarioBody))
        ? Number(valorUnitarioBody)
        : produto.precoUnitario
      const alertaEstoque = await atualizarSaida(
        tx,
        produtoId,
        quantidade,
        id,
        justificativaMovimentacao,
        req.usuario.id
      )
      const valorTotal = quantidade * valorUnitario
      const itemPedido = await tx.itemPedido.update({
        where: { id },
        data: {
          numItem,
          quantidade,
          valorUnitario,
          valorTotal,
          pedidoId,
          produtoId
        }
      })
      const soma = await tx.itemPedido.aggregate({
        where: { pedidoId },
        _sum: { valorTotal: true }
      })
      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          valorTotal: soma._sum.valorTotal || 0
        }
      })
      return { itemPedido, alertaEstoque }
    })
    if (resultado.alertaEstoque.deveNotificarEstoqueBaixo) {
      await notificarEstoqueBaixo(req.usuario.id, resultado.alertaEstoque.produto)
    }
    emitDataChange(req.usuario.id, ["pedidos", "produtos", "movimentacoes", "dashboard"], "item_pedido_atualizado")
    res.json(resultado.itemPedido)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message
    })
  }
}

export const getDia = async (req, res) => {
  try {
    const hoje = new Date()
    // Início e fim do dia no horário local do servidor
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
    const pedidos = await prisma.pedido.findMany({
      where: {
        usuarioId: req.usuario.id,
        createdAt: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json(pedidos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: error.message })
  }
};

export const getRelatorioDia = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query; 

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: "Período não informado." });
    }

    const [anoI, mesI, diaI] = dataInicio.split('-');
    const inicio = new Date(anoI, mesI - 1, diaI, 0, 0, 0);

    const [anoF, mesF, diaF] = dataFim.split('-');
    const fim = new Date(anoF, mesF - 1, diaF, 23, 59, 59);

    const pedidos = await prisma.pedido.findMany({
      where: {
        usuarioId: req.usuario.id,
        status: "Concluído",
        concluidoEm: { 
          gte: inicio, 
          lte: fim 
        },
      },
      include: {
        cliente: { select: { nomeRazaoSocial: true } },
        itens: {
          include: {
            produto: {
              select: { descricao: true, marca: true, precoCusto: true }
            }
          }
        }
      },
      orderBy: { concluidoEm: "asc" },
    });

    let totalBruto = 0;
    let totalCusto = 0;
    
    const faturamentoPorForma = {
      "Distribuição": 0,
      Dinheiro: 0,
      Pix: 0,
      "Cartão Crédito": 0,
      "Cartão Débito": 0,
      "Boleto": 0
    };

    const produtosVendidos = [];

    for (const pedido of pedidos) {
      totalBruto += pedido.valorTotal;

      // Soma o faturamento por forma de pagamento
      if (faturamentoPorForma[pedido.formaPagamento] !== undefined) {
        faturamentoPorForma[pedido.formaPagamento] += pedido.valorTotal;
      }

      for (const item of pedido.itens) {
        const custoItemTotal = (item.produto?.precoCusto || 0) * item.quantidade;
        totalCusto += custoItemTotal;

        produtosVendidos.push({
          id: item.id,
          descricao: item.produto?.descricao || "Produto Não Identificado",
          marca: item.produto?.marca || "-",
          quantidade: item.quantidade,
          precoCusto: item.produto?.precoCusto || 0,
          precoVenda: item.valorUnitario,
          totalVenda: item.valorTotal,
          formaPagamento: pedido.formaPagamento
        });
      }
    }

    res.json({
      produtos: produtosVendidos,
      resumo: {
        quantidadePedidos: pedidos.length,
        totalBruto,
        totalCusto,
        totalLucro: totalBruto - totalCusto,
        formasPagamento: faturamentoPorForma
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
