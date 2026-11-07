import  api  from "./api"

export async function getMovimentacoes(params) {
  if (!params) {
    const response = await api.get("/movimentacoes")
    return response.data.data ?? response.data
  }
  const response = await api.get("/movimentacoes", { params })
  return response.data
}

export async function getMovimentacaoById(id) {
  const response = await api.get(`/movimentacoes/${id}`)
  return response.data
}

export async function createMovimentacao(data) {
  const response = await api.post("/movimentacoes", data)
  return response.data
}