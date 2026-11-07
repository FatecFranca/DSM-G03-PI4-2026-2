import { Router } from 'express'
import { registrarDispositivo } from '../controllers/notificacoesControllers.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/dispositivos', authMiddleware, registrarDispositivo)

export default router
