import { Router } from "express";
import { uploadFile, parseRemoteUrl } from "../controllers/upload_controller.js";
import { uploadMiddleware } from "../middleware/upload_middleware.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();

router.post("/", authMiddleware, uploadMiddleware.single("file"), uploadFile);
router.post("/parse-url", authMiddleware, parseRemoteUrl);

export default router;
