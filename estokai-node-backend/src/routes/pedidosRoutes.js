import { Router } from "express";
import * as pedidosControllers from "../controllers/pedidosControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router();
router.get("/hoje", authMiddleware, pedidosControllers.getDia);
router.get('/relatorio/dia', authMiddleware, pedidosControllers.getRelatorioDia);

router.post('/item', authMiddleware, pedidosControllers.createItemPedido);
router.put('/item/:id', authMiddleware, pedidosControllers.updateItemPedido);

router.get('/', authMiddleware, pedidosControllers.retrieveAll);
router.post('/', authMiddleware, pedidosControllers.create);
router.get('/:id', authMiddleware, pedidosControllers.retrieveOne);
router.put('/:id', authMiddleware, pedidosControllers.update);
router.delete('/:id', authMiddleware, pedidosControllers.deletePedido);

export default router;