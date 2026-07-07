import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth_middleware.js";
import { Document } from "../models/document_model.js";

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
      const { error: deleteError } = await supabase
        .from("drafts")
        .delete()
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return res.json({ drafts: [] });
    }

    const draftIds = drafts.map((d) => d.id);
    const { error: deleteError } = await supabase
      .from("drafts")
      .delete()
      .eq("user_id", userId)
      .not("id", "in", `(${draftIds.map((id) => `"${id}"`).join(",")})`);
    if (deleteError) throw deleteError;

    const rows = drafts.map((draft) => {
      const doc = new Document(
        draft.id,
        draft.title,
        draft.subtitle,
        draft.rawHtml,
        draft.cloudinaryUrl,
        draft.cloudinaryPublicId
      );
      doc.clauses = draft.clauses || [];
      if (draft.createdAt) {
        doc.createdAt = draft.createdAt;
      }
      return {
        id: doc.id,
        user_id: userId,
        payload: doc,
        created_at: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
      };
    });

    const { data, error } = await supabase.from("drafts").upsert(rows, { onConflict: "id" }).select();
    if (error) throw error;

    const mappedDrafts = (data || []).map((row) => {
      const p = row.payload || {};
      const doc = new Document(
        p.id || row.id,
        p.title || "",
        p.subtitle || "",
        p.rawHtml || "",
        p.cloudinaryUrl || "",
        p.cloudinaryPublicId || ""
      );
      doc.clauses = p.clauses || [];
      if (row.created_at) doc.createdAt = row.created_at;
      return {
        ...row,
        payload: doc,
      };
    });

    res.json({ drafts: mappedDrafts });
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

    const mappedDrafts = (data || []).map((row) => {
      const p = row.payload || {};
      const doc = new Document(
        p.id || row.id,
        p.title || "",
        p.subtitle || "",
        p.rawHtml || "",
        p.cloudinaryUrl || "",
        p.cloudinaryPublicId || ""
      );
      doc.clauses = p.clauses || [];
      if (row.created_at) doc.createdAt = row.created_at;
      return {
        ...row,
        payload: doc,
      };
    });

    res.json({ drafts: mappedDrafts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
