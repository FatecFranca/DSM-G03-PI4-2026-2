import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"
import { Router } from "express"

const router=Router()

router.get("/admin",authMiddleware,adminMiddleware);

export default router