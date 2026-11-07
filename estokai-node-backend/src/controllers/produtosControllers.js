import prisma from '../lib/prisma.js'
import { emitDataChange } from '../lib/socket.js'

export const retrieveAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const search = req.query.search?.trim() || "";
    const filtro = req.query.filtro || "Todos";

    const where = {
      usuarioId: req.usuario.id,
      ...(search
        ? {
            OR: [
              { descricao: { contains: search, mode: "insensitive" } },
              { marca: { contains: search, mode: "insensitive" } },
              { codProduto: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    let produtos = await prisma.produto.findMany({
      where,
      include: {
        fornecedores: {
          select: {
            precoUltimaCompra: true,
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                razaoSocial: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Aplica o filtro antes da paginação
    if (filtro === "Critico") {
      produtos = produtos.filter(
        (p) => p.qtdEstoque < p.qtdMinima
      );
    }

    if (filtro === "Normal") {
      produtos = produtos.filter(
        (p) => p.qtdEstoque >= p.qtdMinima
      );
    }

    const total = produtos.length;

    const inicio = (page - 1) * limit;
    const fim = inicio + limit;

    produtos = produtos.slice(inicio, fim);

    return res.json({
      data: produtos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params
    const { descricao, marca, detalhes,codProduto } = req.body
    const peso = Number(String(req.body.peso ?? "").replace(",", "."))
    const balancaId = String(req.body.balancaId ?? "").trim() || null
    if (!id) {
      return res.status(400).json({ erro: "O id do produto é obrigatório!" })
    }
    if (!Number.isFinite(peso) || peso <= 0) {
      return res.status(400).json({ error: "Informe um peso válido em kg" })
    }
    const produtoExiste = await prisma.produto.findFirst({
      where: { id, usuarioId: req.usuario.id }
    })
    if (!produtoExiste) {
      return res.status(404).json({ error: "Produto não encontrado" })
    }
    if (balancaId) {
      const balancaEmUso = await prisma.produto.findFirst({
        where: { usuarioId: req.usuario.id, balancaId, NOT: { id } },
      })
      if (balancaEmUso) {
        return res.status(409).json({ error: "Esta balança já está vinculada a outro produto" })
      }
    }
    let imagemUrl = produtoExiste.imagemUrl
    if (req.file) {
      imagemUrl = req.file.path
    }
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        descricao,
        marca,
        imagemUrl,
        detalhes,
        codProduto,
        peso,
        balancaId,
        precoCusto: parseFloat(req.body.precoCusto),
        precoUnitario: parseFloat(req.body.precoUnitario),
        qtdMinima: parseFloat(req.body.qtdMinima),
      }
    })
    emitDataChange(req.usuario.id, ["produtos", "dashboard"], "produto_atualizado")
    res.json(produto)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const create = async (req, res) => {
  try {
    const { descricao, marca, detalhes,codProduto } = req.body
    const peso = Number(String(req.body.peso ?? "").replace(",", "."))
    const balancaId = String(req.body.balancaId ?? "").trim() || null
    let imagemUrl = null
    if (!Number.isFinite(peso) || peso <= 0) {
      return res.status(400).json({ error: "Informe um peso válido em kg" })
    }
    const consulta = await prisma.produto.findFirst({
      where: {
        descricao,
        usuarioId: req.usuario.id
      }
    })
    if (consulta) {
      return res.status(400).json({ erro: "Ja existe um produto com esta descricao" })
    }
    if (balancaId) {
      const balancaEmUso = await prisma.produto.findFirst({
        where: { usuarioId: req.usuario.id, balancaId },
      })
      if (balancaEmUso) {
        return res.status(409).json({ error: "Esta balança já está vinculada a outro produto" })
      }
    }
    if (req.file) {
      imagemUrl = req.file.path
    }
    const produto = await prisma.produto.create({
      data: {
        descricao,
        marca,
        imagemUrl,
        detalhes,
        codProduto,
        peso,
        balancaId,
        precoCusto: parseFloat(req.body.precoCusto),
        precoUnitario: parseFloat(req.body.precoUnitario),
        qtdMinima: parseFloat(req.body.qtdMinima),
        usuarioId: req.usuario.id
      }
    })
    emitDataChange(req.usuario.id, ["produtos", "dashboard"], "produto_criado")
    res.json(produto)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const retrieveOne = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ erro: "O id do produto é obrigatório!" })
    }
    const produto = await prisma.produto.findFirst({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      include: {
        fornecedores: {
          include: {
            fornecedor: true
          }
        }
      }
    })
    res.json(produto)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const deleteProduto = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ erro: "O id do produto é obrigatório!" })
    }
    const produtoExiste = await prisma.produto.findFirst({
      where: { id, usuarioId: req.usuario.id }
    })
    if (!produtoExiste) {
      return res.status(404).json({ error: "Produto não encontrado" })
    }
    await prisma.produtoFornecedor.deleteMany({
      where: {
        produtoId: id
      }
    })
    const produto = await prisma.produto.delete({
      where: { id }
    })
    emitDataChange(req.usuario.id, ["produtos", "dashboard"], "produto_removido")
    res.json(produto)
  } catch (error) {
    if (error?.code === 'P2025') {
      res.status(404).end()
    } else {
      console.error(error)
      res.status(500).send(error)
    }
  }
}

export const addFornecedor = async (req, res) => {
  try {
    const { id } = req.params
    const { fornecedorId, precoUltimaCompra } = req.body
    const produto = await prisma.produto.findFirst({
      where: { id, usuarioId: req.usuario.id }
    })
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" })
    }
    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id: fornecedorId, usuarioId: req.usuario.id }
    })
    if (!fornecedor) {
      return res.status(404).json({ error: "Fornecedor não encontrado" })
    }
    const vinculo = await prisma.produtoFornecedor.upsert({
      where: {
        produtoId_fornecedorId: {
          produtoId: id,
          fornecedorId
        }
      },
      update: { precoUltimaCompra },
      create: {
        produtoId: id,
        fornecedorId,
        precoUltimaCompra
      }
    })
    emitDataChange(req.usuario.id, ["produtos"], "produto_fornecedor_atualizado")
    res.json(vinculo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export const removeFornecedor = async (req, res) => {
  try {
    const { id, fornecedorId } = req.params
    await prisma.produtoFornecedor.delete({
      where: {
        produtoId_fornecedorId: {
          produtoId: id,
          fornecedorId
        }
      }
    })
    emitDataChange(req.usuario.id, ["produtos"], "produto_fornecedor_removido")
    res.status(204).end()
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).end()
    }
    res.status(500).json({ error: error.message })
  }
}

export const getDia = async (req, res) => {
  try {
    const hoje = new Date();
    // Início e fim do dia no horário local do servidor
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
    const produtos = await prisma.produto.findMany({
      where: {
        usuarioId: req.usuario.id,
        createdAt: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(produtos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: error.message });
  }
};
