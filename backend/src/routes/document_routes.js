import { Router } from "express";
import { getDocuments, deleteDocument } from "../controllers/document_controller.js";

const router = Router();

router.get("/", getDocuments);
router.delete("/", deleteDocument);

export default router;
