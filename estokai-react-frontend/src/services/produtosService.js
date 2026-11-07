import  api  from "./api"

export async function getProdutos(params) {
  if (!params) {
    const response = await api.get("/produtos")
    return response.data.data ?? response.data
  }
  const response = await api.get("/produtos", { params })
  return response.data
}

export async function getProdutoById(id) {
  const response = await api.get(`/produtos/${id}`)
  return response.data
}

export async function createProduto(formData) {
  const response = await api.post(
    "/produtos",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  )
  return response.data
}

export async function updateProduto(id, data) {
  const response = await api.put(`/produtos/${id}`, data)
  return response.data
}

export async function deleteProduto(id) {
  const response = await api.delete(`/produtos/${id}`)
  return response.data
}

export async function addFornecedorProduto(produtoId,fornecedorId) {
  const response = await api.post(
    `/produtos/${produtoId}/fornecedor`,
    {
      fornecedorId
    }
  )
  return response.data
}

export async function removeFornecedorProduto(produtoId,fornecedorId) {
  const response = await api.delete(
    `/produtos/${produtoId}/fornecedor/${fornecedorId}`
  )
  return response.data
}

export async function uploadImagemProduto(produtoId,imagem) {
  const formData = new FormData()
  formData.append("imagem", imagem)
  const response = await api.post(
    `/produtos/${produtoId}/imagem`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  )
  return response.data
}