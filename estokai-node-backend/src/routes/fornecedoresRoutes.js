import { Router } from "express";
import * as fornecedoresControllers from "../controllers/fornecedoresControllers.js";
import {authMiddleware} from "../middlewares/authMiddleware.js"

const router = Router();

// api para buscar todos fornecedores adicionados hoje
router.get("/hoje",authMiddleware, fornecedoresControllers.getDia);

router.get('/',authMiddleware,fornecedoresControllers.retrieveAll);
router.post('/',authMiddleware,fornecedoresControllers.create);
router.get('/:id',authMiddleware,fornecedoresControllers.retrieveOne);
router.put('/:id',authMiddleware,fornecedoresControllers.update);
router.delete('/:id',authMiddleware,fornecedoresControllers.deleteFornecedor);


export default router;  