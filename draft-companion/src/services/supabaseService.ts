import type { Draft } from "@/types/document";

export const supabaseService = {
  async saveDrafts(userId: string, drafts: Draft[]) {
    if (!drafts.length) return [];

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("http://localhost:5000/api/supabase/drafts", {
      method: "POST",
      headers,
      body: JSON.stringify({ drafts }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to save drafts to backend");
    }

    const data = await response.json();
    return data.drafts ?? [];
  },

  async loadDrafts(userId: string) {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("http://localhost:5000/api/supabase/drafts", {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to load drafts from backend");
    }

    const data = await response.json();
    return (data.drafts ?? []).map((row: any) => row.payload as Draft);
  },
};
