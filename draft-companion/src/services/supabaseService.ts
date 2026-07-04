import { supabase } from "@/lib/supabase";
import type { Draft } from "@/types/document";

export const supabaseService = {
  async saveDrafts(userId: string, drafts: Draft[]) {
    if (!drafts.length) return [];

    const rows = drafts.map((draft) => ({
      id: draft.id,
      user_id: userId,
      payload: draft,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase.from("drafts").upsert(rows, { onConflict: "id" }).select();
    if (error) throw error;
    return data ?? [];
  },

  async loadDrafts(userId: string) {
    const { data, error } = await supabase.from("drafts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => row.payload as Draft);
  },
};
