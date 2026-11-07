import api from "./api"

export async function getLatestTelemetry() {
  const response = await api.get("/telemetria/latest")
  return response.data
}

export async function getTelemetryStatistics(params) {
  const response = await api.get("/telemetria/estatisticas", { params })
  return response.data
}

export async function getBusinessHours() {
  const response = await api.get("/telemetria/horario-comercial")
  return response.data
}

export async function updateBusinessHours(horarioInicio, horarioFim, temperaturaVentilador) {
  const response = await api.put("/telemetria/horario-comercial", { horarioInicio, horarioFim, temperaturaVentilador })
  return response.data
}

export async function getTelemetryDevice() {
  const response = await api.get("/telemetria/dispositivo")
  return response.data
}

export async function updateTelemetryDevice(deviceId) {
  const response = await api.put("/telemetria/dispositivo", { deviceId })
  return response.data
}
