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
  }) =>
    api.post<ChatResponse>("/api/analysis/chat", payload),
};
