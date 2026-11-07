import { Router } from "express"
import { getBusinessHoursConfiguration, getLatestTelemetry, getTelemetryDeviceConfiguration, getTelemetryStatistics, saveBusinessHoursConfiguration, saveTelemetryDeviceConfiguration } from "../controllers/telemetriaControllers.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

router.get("/latest", authMiddleware, getLatestTelemetry)
router.get("/estatisticas", authMiddleware, getTelemetryStatistics)
router.get("/dispositivo", authMiddleware, getTelemetryDeviceConfiguration)
router.put("/dispositivo", authMiddleware, saveTelemetryDeviceConfiguration)
router.get("/horario-comercial", authMiddleware, getBusinessHoursConfiguration)
router.put("/horario-comercial", authMiddleware, saveBusinessHoursConfiguration)

export default router
