import  api  from "./api"

export async function getPedidos(params) {
  if (!params) {
    const response = await api.get("/pedidos")
    return response.data.data ?? response.data
  }
  const response = await api.get("/pedidos", { params })
  return response.data
}

export async function getPedidoById(id) {
  const response = await api.get(`/pedidos/${id}`)
  return response.data
}

export async function createPedido(data) {
  const response = await api.post("/pedidos", data)
  return response.data
}

export async function updatePedido(id, data) {
  const response = await api.put(`/pedidos/${id}`, data)
  return response.data
}

export async function deletePedido(id, justificativa) {
  const response = await api.delete(`/pedidos/${id}`, {
    data: {
      justificativa
    }
  })
  return response.data
}

export async function createItemPedido(data) {
  const response = await api.post("/pedidos/item", data)
  return response.data
}

export async function updateItemPedido(id, data) {
  const response = await api.put(`/pedidos/item/${id}`, data)
  return response.data
}
export async function getRelatorioPedidosDia(dataInicio, dataFim) {
  const response = await api.get(`/pedidos/relatorio/dia?dataInicio=${dataInicio}&dataFim=${dataFim}`);
  return response.data;
}