import express from 'express';
// Importe a função que acabamos de criar
import { getDashboardResumoCompleto } from '../controllers/dashboardControllers.js';
// Importe seu middleware de autenticação se houver (para garantir req.usuario)
import { authMiddleware } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// Cria a rota única
router.get('/resumo', authMiddleware, getDashboardResumoCompleto);

export default router;