import  api  from "./api"

export async function getDashboardResumoCompleto() {
  const response = await api.get('/dashboard/resumo'); 
  return response.data;
}