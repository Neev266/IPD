import { Router } from "express";
import { getDocuments, deleteDocument } from "../controllers/document_controller.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();

router.get("/", authMiddleware, getDocuments);
router.delete("/", authMiddleware, deleteDocument);

export default router;
