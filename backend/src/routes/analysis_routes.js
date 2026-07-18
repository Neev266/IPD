import { Router } from "express";
import { getAnalysis, handleChat } from "../controllers/analysis_controller.js";

const router = Router();

router.post("/", getAnalysis);
router.post("/chat", handleChat);

export default router;
