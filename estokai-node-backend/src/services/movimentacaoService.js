export async function registrarEntrada(tx, produtoId, quantidade, justificativa, usuarioId) {

  const produto = await tx.produto.findFirst({
    where: {
      id: produtoId,
      usuarioId
    }
  })
  if (!produto) {
    throw new Error("Produto não encontrado")
  }
  await tx.movimentacao.create({
    data: {
      justificativa,
      quantidade,
      produtoId,
      usuarioId
    }
  })
  await tx.produto.update({
    where: { id: produtoId },
    data: {
      qtdEstoque: produto.qtdEstoque + quantidade
    }
  })
}

export async function registrarSaida(tx, produtoId, quantidade, itemPedidoId, justificativa, usuarioId) {

  const produto = await tx.produto.findFirst({
    where: {
      id: produtoId,
      usuarioId
    }
  })
  if (!produto) {
    throw new Error("Produto não encontrado")
  }
  if (produto.qtdEstoque < quantidade) {
    throw new Error("Quantidade insuficiente em estoque")
  }
  await tx.movimentacao.create({
    data: {
      justificativa,
      quantidade: -Math.abs(quantidade),
      produtoId,
      itemPedidoId,
      usuarioId
    }
  })
  const qtdEstoqueAtual = produto.qtdEstoque - quantidade
  await tx.produto.update({
    where: { id: produtoId },
    data: {
      qtdEstoque: qtdEstoqueAtual
    }
  })
  return {
    produto: { ...produto, qtdEstoque: qtdEstoqueAtual },
    deveNotificarEstoqueBaixo: produto.qtdEstoque >= produto.qtdMinima && qtdEstoqueAtual < produto.qtdMinima,
  }
}

export async function atualizarSaida(tx, produtoId, novaQuantidade, itemPedidoId, justificativa, usuarioId) {

  const itemAntigo = await tx.itemPedido.findUnique({
    where: { id: itemPedidoId }
  })
  if (!itemAntigo) {
    throw new Error("Item do pedido não encontrado")
  }
  const produto = await tx.produto.findFirst({
    where: {
      id: produtoId,
      usuarioId
    }
  })
  if (!produto) {
    throw new Error("Produto não encontrado")
  }
  const diferenca = novaQuantidade - itemAntigo.quantidade
  if (diferenca === 0) {
    return { produto, deveNotificarEstoqueBaixo: false }
  }
  if (
    diferenca > 0 &&
    produto.qtdEstoque < diferenca
  ) {
    throw new Error("Quantidade insuficiente em estoque")
  }
  const qtdEstoqueAtual = diferenca > 0
    ? produto.qtdEstoque - diferenca
    : produto.qtdEstoque + Math.abs(diferenca)
  await tx.produto.update({
    where: { id: produtoId },
    data: {
      qtdEstoque: qtdEstoqueAtual
    }
  })
  if (novaQuantidade > itemAntigo.quantidade) {
  await tx.movimentacao.create({
    data: {
      justificativa,
      quantidade: -Math.abs(diferenca),
      produtoId,
      itemPedidoId,
      usuarioId
    }
  })
}
  if (novaQuantidade < itemAntigo.quantidade) {
    await tx.movimentacao.create({
      data: {
        justificativa,
        quantidade: + Math.abs(diferenca),
        produtoId,
        itemPedidoId,
        usuarioId
      }
    })
  }
  return {
    produto: { ...produto, qtdEstoque: qtdEstoqueAtual },
    deveNotificarEstoqueBaixo: produto.qtdEstoque >= produto.qtdMinima && qtdEstoqueAtual < produto.qtdMinima,
  }
}

export async function cancelarSaida(tx, produtoId, quantidade, itemPedidoId, justificativa, usuarioId) {

  const produto = await tx.produto.findFirst({
    where: {
      id: produtoId,
      usuarioId
    }
  })
  if (!produto) {
    throw new Error("Produto não encontrado")
  }
  await tx.produto.update({
    where: { id: produtoId },
    data: {
      qtdEstoque: produto.qtdEstoque + quantidade
    }
  })
  await tx.movimentacao.create({
    data: {
      justificativa,
      quantidade,
      produtoId,
      itemPedidoId,
      usuarioId
    }
  })
}
