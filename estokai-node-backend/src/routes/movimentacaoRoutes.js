import { Router } from "express";
import * as movimentacaoControllers from "../controllers/movimentacaoControllers.js";
import {authMiddleware} from "../middlewares/authMiddleware.js"

const router = Router();

router.get('/',authMiddleware,movimentacaoControllers.retrieveAll);
router.post('/',authMiddleware,movimentacaoControllers.create);
router.get('/:id',authMiddleware,movimentacaoControllers.retrieveOne);

export default router;  