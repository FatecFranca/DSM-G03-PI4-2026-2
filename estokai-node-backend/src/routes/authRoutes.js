import { Router } from "express"
import {register,login,deleteUsuario,getAll} from "../controllers/authController.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"
import {authMiddleware} from "../middlewares/authMiddleware.js"

const router = Router()

// Cadastro público: novos usuários recebem somente o acesso padrão (não admin).
router.post("/register", register);
router.post("/login", login);
router.get("/usuarios",authMiddleware,adminMiddleware, getAll);
router.delete("/usuarios/:id",authMiddleware,adminMiddleware, deleteUsuario);

export default router
