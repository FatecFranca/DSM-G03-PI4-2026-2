import api from "./api"

export async function getClientes(params) {
  if (!params) {
    const response = await api.get("/clientes")
    return response.data.data ?? response.data
  }
  const response = await api.get("/clientes", { params })
  return response.data
}

export async function getClienteById(id) {
  const response = await api.get(`/clientes/${id}`)
  return response.data
}

export async function createCliente(data) {
  const response = await api.post("/clientes", data)
  return response.data
}

export async function updateCliente(id, data) {
  const response = await api.put(`/clientes/${id}`, data)
  return response.data
}

export async function deleteCliente(id) {
  const response = await api.delete(`/clientes/${id}`)
  return response.data
}
export async function getTodosClientes() {
  const response = await api.get("/clientes", {
    params: {
      all: true
    }
  });

  return response.data;
}