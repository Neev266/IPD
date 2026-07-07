import { Router } from "express";
import { ingestDocument, searchDocument } from "../controllers/pipeline_controller.js";
import { authMiddleware } from "../middleware/auth_middleware.js";
import { uploadMiddleware } from "../middleware/upload_middleware.js";

const router = Router();

/**
 * @route   POST /api/pipeline/ingest
 * @desc    Ingests a legal HTML document, chunks it, generates embeddings, and saves to database.
 * @access  Private
 */
router.post("/ingest", authMiddleware, uploadMiddleware.single("file"), ingestDocument);

/**
 * @route   POST/GET /api/pipeline/search
 * @desc    Searches for semantically matching legal chunks based on query cosine distance.
 * @access  Private
 */
router.post("/search", authMiddleware, searchDocument);
router.get("/search", authMiddleware, searchDocument);

export default router;
