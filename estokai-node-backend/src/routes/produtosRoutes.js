import {Router} from 'express';
import * as produtoControllers from '../controllers/produtosControllers.js'
import upload from "../middlewares/uploadMiddleware.js";
import {authMiddleware} from "../middlewares/authMiddleware.js"

const router = Router();

// api para buscar todos produtos de hoje
router.get("/hoje",authMiddleware, produtoControllers.getDia);

router.get('/',authMiddleware,produtoControllers.retrieveAll);
router.post('/',authMiddleware,upload.single('imagem'),produtoControllers.create);
router.get('/:id',authMiddleware,produtoControllers.retrieveOne);
router.put('/:id',authMiddleware,upload.single("imagem"),produtoControllers.update);
router.delete('/:id',authMiddleware,produtoControllers.deleteProduto);
// prdutoFornecedor
router.post('/:id/fornecedor',authMiddleware,produtoControllers.addFornecedor);
router.delete('/:id/fornecedor/:fornecedorId',authMiddleware,produtoControllers.removeFornecedor);


export default router;   