import { Router } from "express";
import { getAnalysis } from "../controllers/analysis_controller.js";

const router = Router();

router.post("/", getAnalysis);

export default router;
