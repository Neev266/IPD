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

export const analysisApi = {
  analyze: (htmlContent: string, documentId: string) =>
    api.post<AnalysisResponse>("/api/analysis", { htmlContent, documentId }),
};
