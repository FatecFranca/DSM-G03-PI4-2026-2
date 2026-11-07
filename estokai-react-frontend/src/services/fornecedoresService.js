import api from "./api"

export async function getFornecedores(params) {
  if (!params) {
    const response = await api.get("/fornecedores")
    return response.data.data ?? response.data
  }
  const response = await api.get("/fornecedores", { params })
  return response.data
}

export async function getFornecedorById(id) {
  const response = await api.get(`/fornecedores/${id}`)
  return response.data
}

export async function createFornecedor(data) {
  const response = await api.post("/fornecedores", data)
  return response.data
}

export async function updateFornecedor(id, data) {
  const response = await api.put(`/fornecedores/${id}`, data)
  return response.data
}

export async function deleteFornecedor(id) {
  const response = await api.delete(`/fornecedores/${id}`)
  return response.data
}

export async function getTodosFornecedores() {
  const response = await api.get("/fornecedores", {
    params: {
      all: true
    }
  });

  return response.data;
}