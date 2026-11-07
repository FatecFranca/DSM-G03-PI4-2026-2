import { getBusinessHours, getIotStatistics, getLatestTelemetryReadings, getTelemetryDevice, updateBusinessHours, updateTelemetryDevice } from "../services/telemetriaService.js"

export async function getLatestTelemetry(req, res) {
  try {
    const readings = await getLatestTelemetryReadings(req.usuario.id)
    res.json(readings)
  } catch (error) {
    console.error("Erro ao buscar telemetria:", error)
    res.status(500).json({ error: error.message })
  }
}

export async function getTelemetryDeviceConfiguration(req, res) {
  try {
    res.json(await getTelemetryDevice(req.usuario.id))
  } catch (error) {
    console.error("Erro ao buscar dispositivo IoT:", error)
    res.status(500).json({ error: error.message })
  }
}

export async function saveTelemetryDeviceConfiguration(req, res) {
  try {
    res.json(await updateTelemetryDevice(req.usuario.id, req.body.deviceId))
  } catch (error) {
    console.error("Erro ao salvar dispositivo IoT:", error)
    res.status(error.status || 500).json({ error: error.message })
  }
}

export async function getTelemetryStatistics(req, res) {
  try {
    const visualizacao = req.query.visualizacao || "Dia"
    const statistics = await getIotStatistics(req.usuario.id, visualizacao)
    res.json(statistics)
  } catch (error) {
    console.error("Erro ao buscar estatisticas IoT:", error)
    res.status(500).json({ error: error.message })
  }
}

export async function getBusinessHoursConfiguration(req, res) {
  try {
    res.json(await getBusinessHours(req.usuario.id))
  } catch (error) {
    console.error("Erro ao buscar horário comercial:", error)
    res.status(500).json({ error: error.message })
  }
}

export async function saveBusinessHoursConfiguration(req, res) {
  try {
    res.json(await updateBusinessHours(req.usuario.id, req.body))
  } catch (error) {
    console.error("Erro ao atualizar horário comercial:", error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
