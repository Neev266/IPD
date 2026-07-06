import { Router } from "express";
import uploadRoutes from "./upload_routes.js";
import documentRoutes from "./document_routes.js";
import analysisRoutes from "./analysis_routes.js";
import supabaseRoutes from "./supabase_routes.js";
import authRoutes from "./auth_routes.js";

const router = Router();

// Mount all route modules
router.use("/auth", authRoutes);
router.use("/upload", uploadRoutes);
router.use("/documents", documentRoutes);
router.use("/analysis", analysisRoutes);
router.use("/supabase", supabaseRoutes);

export default router;
