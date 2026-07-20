import { Router } from "express";
import { getAnalysis, handleChat, createChatSession, getChatSessions, getChatMessages } from "../controllers/analysis_controller.js";

const router = Router();

router.post("/", getAnalysis);
router.post("/chat", handleChat);
router.post("/chat/session", createChatSession);
router.get("/chat/sessions", getChatSessions);
router.get("/chat/session/:sessionId", getChatMessages);

export default router;
