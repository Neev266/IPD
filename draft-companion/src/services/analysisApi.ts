import { api } from "./api";

export interface AnalysisPayload {
  id: string;
  documentId: string;
  riskScore: number;
  findings: any[];
  analyzedAt: string;
}

export interface AnalysisResponse {
  success: boolean;
  message: string;
  analysis: AnalysisPayload;
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  memoryContext: string;
}

export const analysisApi = {
  analyze: (htmlContent: string, documentId: string, documentName?: string) =>
    api.post<AnalysisResponse>("/api/analysis", { htmlContent, documentId, documentName }),

  chat: (payload: {
    message: string;
    history: ChatMessage[];
    memoryContext: string | null;
    documentId: string;
    documentName: string;
    sessionId?: string;
  }) =>
    api.post<ChatResponse>("/api/analysis/chat", payload),

  createSession: (documentId: string, documentName: string) =>
    api.post<{ success: boolean; session: any }>("/api/analysis/chat/session", { documentId, documentName }),

  getSessions: (documentId: string, documentName: string) =>
    api.get<{ success: boolean; sessions: any[] }>(`/api/analysis/chat/sessions?documentId=${documentId}&documentName=${encodeURIComponent(documentName)}`),

  getSessionMessages: (sessionId: string) =>
    api.get<{ success: boolean; messages: any[] }>(`/api/analysis/chat/session/${sessionId}`),
};
