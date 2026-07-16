import { api } from "./api";

export interface IngestResponse {
  success: boolean;
  message: string;
  documentId: string;
  chunkCount: number;
}

export interface SearchResult {
  id: number;
  document_id: string;
  content: string;
  section_header: string | null;
  similarity: number;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  results: SearchResult[];
}

export const pipelineApi = {
  ingest: (documentName: string, html: string) =>
    api.post<IngestResponse>("/api/pipeline/ingest", { documentName, html }),

  search: (query: string, threshold: number, limit: number) =>
    api.post<SearchResponse>("/api/pipeline/search", { query, threshold, limit }),
};
