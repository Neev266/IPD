export type AnalysisState = "idle" | "ready" | "analyzing" | "results";

export interface Clause {
  id: number;
  title: string;
  content: string;
}

export interface Draft {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  clauses?: Clause[];
  rawHtml?: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}
