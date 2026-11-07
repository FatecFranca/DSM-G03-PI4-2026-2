import { PrismaClient } from '@prisma/client'
import { registrarEntrada } from '../services/movimentacaoService.js'
import { emitDataChange } from '../lib/socket.js'

const prisma = new PrismaClient()

export const retrieveAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 15 
    const search = req.query.search || ""
    const skip = (page - 1) * limit

    const whereCondition = {
      usuarioId: req.usuario.id
    }

    // Regra de busca dinâmica
    if (search) {
      const searchNum = parseInt(search.replace(/\D/g, '')) 
      
      whereCondition.OR = [
        { justificativa: { contains: search, mode: 'insensitive' } },
        { produto: { descricao: { contains: search, mode: 'insensitive' } } },
        { produto: { marca: { contains: search, mode: 'insensitive' } } }
      ]

      // Se a busca contiver um número (ex: buscando pedido "PED-12"), adiciona na pesquisa
      if (!isNaN(searchNum)) {
        whereCondition.OR.push({ 
          itemPedido: { pedido: { numPedido: searchNum } } 
        })
      }
    }

    const [movimentacoes, total] = await Promise.all([
      prisma.movimentacao.findMany({
        where: whereCondition,
        include: { 
          produto: true, 
          itemPedido: { include: { pedido: true } } 
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.movimentacao.count({
        where: whereCondition
      })
    ])

    res.json({
      data: movimentacoes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const create = async (req, res) => {
  try {
    const { quantidade, justificativa, produtoId } = req.body
    // transacao atomica para registrar entrada de produtos
    await prisma.$transaction(async (tx) => {
      await registrarEntrada(
        tx,
        produtoId,
        quantidade,
        justificativa,
        req.usuario.id
      )
    })
    emitDataChange(req.usuario.id, ["produtos", "movimentacoes", "dashboard"], "movimentacao_criada")
    res.json({ message: "Movimentação registrada com sucesso!" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const retrieveOne = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ erro: "O id da movimentacao é obrigatório!" })
    }
    const movimentacao = await prisma.movimentacao.findFirst({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      include: { produto: true, itemPedido: true }
    })
    res.json(movimentacao)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}
