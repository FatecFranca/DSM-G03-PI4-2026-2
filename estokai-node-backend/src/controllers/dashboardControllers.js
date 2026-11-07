import prisma from '../lib/prisma.js'

export const getDashboardResumoCompleto = async (req, res) => {
  try {
    const userId = req.usuario.id;

    // Datas importantes para os filtros
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera as horas para pegar do início do dia

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    
    const doisDiasAtras = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const [
      totalProdutos,
      totalPedidosMes,
      totalFornecedores,
      totalClientes,
      recentes,
      produtosParaEstoqueCritico,
      estoqueDia,
      pedidosDia,
      clienteDia,
      fornecedoresDia
    ] = await Promise.all([
      prisma.produto.count({ where: { usuarioId: userId } }),
      prisma.pedido.count({ where: { usuarioId: userId, createdAt: { gte: inicioMes, lt: fimMes } } }),
      prisma.fornecedor.count({ where: { usuarioId: userId } }),
      prisma.cliente.count({ where: { usuarioId: userId } }),

      prisma.pedido.findMany({
        where: { usuarioId: userId, createdAt: { gte: doisDiasAtras } },
        orderBy: { createdAt: "desc" },
        include: { cliente: true },
        take: 20
      }),

      prisma.produto.findMany({
        where: { usuarioId: userId },
        select: { id: true, descricao: true, marca: true, qtdEstoque: true, qtdMinima: true, precoUnitario: true }
      }),

      prisma.produto.findMany({ where: { usuarioId: userId, createdAt: { gte: hoje } } }),
      prisma.pedido.findMany({ where: { usuarioId: userId, createdAt: { gte: hoje } } }),
      prisma.cliente.findMany({ where: { usuarioId: userId, createdAt: { gte: hoje } } }),
      prisma.fornecedor.findMany({ where: { usuarioId: userId, createdAt: { gte: hoje } } })
    ]);

    const estoqueCritico = produtosParaEstoqueCritico.filter(
      produto => produto.qtdEstoque < produto.qtdMinima
    );

    res.json({
      produtos: totalProdutos,
      pedidos: totalPedidosMes,
      fornecedores: totalFornecedores,
      clientes: totalClientes,
      estoqueCritico,
      recentes,
      estoqueDia,
      pedidosDia,
      clienteDia,
      fornecedoresDia
    });

  } catch (error) {
    console.error("Erro ao carregar resumo do dashboard:", error);
    res.status(500).json({ error: error.message });
  }
}