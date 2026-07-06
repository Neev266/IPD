import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth_middleware.js";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("drafts").select("count", { count: "exact", head: true });
    if (error) throw error;
    res.json({ ok: true, count: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert drafts for the authenticated user
router.post("/drafts", authMiddleware, async (req, res) => {
  try {
    const { drafts } = req.body;
    const userId = req.user.id;

    if (!drafts || !Array.isArray(drafts)) {
      return res.status(400).json({ error: "Invalid drafts payload" });
    }

    if (drafts.length === 0) {
      return res.json({ drafts: [] });
    }

    const rows = drafts.map((draft) => ({
      id: draft.id,
      user_id: userId,
      payload: draft,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase.from("drafts").upsert(rows, { onConflict: "id" }).select();
    if (error) throw error;
    res.json({ drafts: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Load drafts for the authenticated user
router.get("/drafts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ drafts: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
