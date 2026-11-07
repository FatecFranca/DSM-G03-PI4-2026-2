import prisma from '../lib/prisma.js'

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

    // Regra de busca dinâmica para clientes
    if (search) {
      whereCondition.OR = [
        { nomeRazaoSocial: { contains: search, mode: 'insensitive' } },
        { cpfCnpj: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (all) {
      const clientes = await prisma.cliente.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: { pedidos: true }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return res.json(clientes);
    }
    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where: whereCondition, 
        include: {
          _count: {
            select: { pedidos: true }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.cliente.count({
        where: whereCondition 
      })
    ])

    res.json({
      data: clientes,
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
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { cnpj, nomeRazaoSocial, cpfCnpj, email, dataCadastro, logradouro, numImovel, complemento, bairro, municipio, uf, cep, celular1, celular2 } = req.body;
    if (!id) {
      return res.status(400).json({ erro: "O id do cliente é obrigatório!" });
    }
    const clienteExiste = await prisma.cliente.findFirst({ where: { id, usuarioId: req.usuario.id } })
    if (!clienteExiste) {
      return res.status(404).json({ error: "Cliente não encontrado" })
    }
    const cliente = await prisma.cliente.update({
      where: { id },
      data: { cnpj, nomeRazaoSocial, cpfCnpj, email, dataCadastro, logradouro, numImovel, complemento, bairro, municipio, uf, cep, celular1, celular2 }
    });
    res.json(cliente);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
};

export const create = async (req, res) => {

  try {
    const { cnpj, nomeRazaoSocial, cpfCnpj, email, dataCadastro, logradouro, numImovel, complemento, bairro, municipio, uf, cep, celular1, celular2 } = req.body;
    const cliente = await prisma.cliente.create({
      data: {
        cnpj,
        nomeRazaoSocial,
        cpfCnpj,
        email,
        dataCadastro,
        logradouro,
        numImovel,
        complemento,
        bairro,
        municipio,
        uf,
        cep,
        celular1,
        celular2,
        usuarioId: req.usuario.id
      }
    })
    res.json(cliente)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }

}

export const retrieveOne = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ erro: "O id do cliente é obrigatório!" });
    }
    const cliente = await prisma.cliente.findFirst({ where: { id: id, usuarioId: req.usuario.id } })
    res.json(cliente)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ erro: "O id do cliente é obrigatório!" });
    }
    const clienteExiste = await prisma.cliente.findFirst({ where: { id, usuarioId: req.usuario.id } })
    if (!clienteExiste) {
      return res.status(404).json({ error: "Cliente não encontrado" })
    }
    const cliente = await prisma.cliente.delete({ where: { id: id } })
    res.json(cliente)
  } catch (error) {
    // P2025: erro do Prisma referente a objeto não encontrado
    if (error?.code === 'P2025') {
      res.status(404).end()
    }
    else {
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
    const clientes = await prisma.cliente.findMany({
      where: {
        usuarioId: req.usuario.id,
        createdAt: {
          gte: inicio,
          lte: fim,
        }
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(clientes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: error.message })
  }
};

export const totalPedidosCliente = async (req, res) => {
  try {
    const { id } = req.params
    const total = await prisma.pedido.count({
      where: {
        clienteId: id
      }
    })
    res.status(200).json({
      totalPedidos: total
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      erro: "Erro ao buscar total de pedidos"
    })
  }
}
