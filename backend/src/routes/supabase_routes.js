import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("documents").select("count", { count: "exact", head: true });
    if (error) throw error;
    res.json({ ok: true, count: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/drafts", async (req, res) => {
  try {
    const { userId, draft } = req.body;
    const { data, error } = await supabase.from("drafts").insert([{ user_id: userId, payload: draft }]).select();
    if (error) throw error;
    res.json({ draft: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/drafts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase.from("drafts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ drafts: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
