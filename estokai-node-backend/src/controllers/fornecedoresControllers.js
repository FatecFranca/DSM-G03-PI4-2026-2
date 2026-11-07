import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const retrieveAll = async (req, res) => {
  try {
    const all = req.query.all === "true";

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 8 
    const search = req.query.search || ""
    const skip = (page - 1) * limit

    const whereCondition = {
      usuarioId: req.usuario.id
    }

    if (search) {
      whereCondition.OR = [
        { razaoSocial: { contains: search, mode: 'insensitive' } },
        { nomeFantasia: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (all) {
      const fornecedores = await prisma.fornecedor.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: { produtos: true }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return res.json(fornecedores);
    }
    const [fornecedores, total] = await Promise.all([
      prisma.fornecedor.findMany({
        where: whereCondition,
        include: { _count: { select: { produtos: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fornecedor.count({
        where: whereCondition
      })
    ])

    res.json({
      data: fornecedores,
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
    const { razaoSocial, nomeFantasia, cnpj, email, logradouro, numImovel, complemento, bairro, municipio, uf, cep, telefone1, telefone2, categoria } = req.body
    if (!id) {
      return res.status(400).json({ erro: "O id do fornecedor é obrigatório!" })
    }
    const fornecedorExiste = await prisma.fornecedor.findFirst({
      where: { id, usuarioId: req.usuario.id }
    })
    if (!fornecedorExiste) {
      return res.status(404).json({ error: "Fornecedor não encontrado" })
    }
    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data: {
        razaoSocial,
        nomeFantasia,
        cnpj,
        email,
        logradouro,
        numImovel,
        complemento,
        bairro,
        municipio,
        uf,
        cep,
        telefone1,
        telefone2,
        categoria
      }
    })
    res.json(fornecedor)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const create = async (req, res) => {
  try {
    const { razaoSocial, nomeFantasia, cnpj, email, logradouro, numImovel, complemento, bairro, municipio, uf, cep, telefone1, telefone2, categoria } = req.body
    const fornecedor = await prisma.fornecedor.create({
      data: {
        razaoSocial,
        nomeFantasia,
        cnpj,
        email,
        logradouro,
        numImovel,
        complemento,
        bairro,
        municipio,
        uf,
        cep,
        telefone1,
        telefone2,
        categoria,
        usuarioId: req.usuario.id
      }
    })
    res.json(fornecedor)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const retrieveOne = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ erro: "O id do fornecedor é obrigatório!" })
    }
    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      include: {
        produtos: {
          include: {
            produto: true
          }
        }
      }
    })
    res.json(fornecedor)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const deleteFornecedor = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ erro: "O id do fornecedor é obrigatório!" })
    }
    const fornecedorExiste = await prisma.fornecedor.findFirst({
      where: { id, usuarioId: req.usuario.id }
    })
    if (!fornecedorExiste) {
      return res.status(404).json({ error: "Fornecedor não encontrado" })
    }
    const fornecedor = await prisma.fornecedor.delete({
      where: { id }
    })
    res.json(fornecedor)
  } catch (error) {
    if (error?.code === 'P2025') {
      res.status(404).end()
    } else {
      console.error(error)
      res.status(500).send(error)
    }
  }
}

export const getDia = async (req, res) => {
  try {
    const hoje = new Date()
    // Início e fim do dia no horário local do servidor
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
    const fornecedores = await prisma.fornecedor.findMany({
      where: {
        usuarioId: req.usuario.id,
        createdAt: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json(fornecedores)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: error.message })
  }
};