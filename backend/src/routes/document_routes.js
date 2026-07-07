import { Router } from "express";
import { getDocuments, deleteDocument, saveDocument } from "../controllers/document_controller.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();

router.get("/", authMiddleware, getDocuments);
router.post("/save", authMiddleware, saveDocument);
router.delete("/", authMiddleware, deleteDocument);

export default router;
