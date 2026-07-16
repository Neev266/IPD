import { api } from "./api";

export interface CloudinaryResource {
  fileName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  date: string;
}

export interface ListDocumentsResponse {
  success: boolean;
  message: string;
  resources: CloudinaryResource[];
}

export interface SaveDocumentResponse {
  success: boolean;
  message: string;
  result: any;
}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
  result: any;
}

export const documentApi = {
  list: () =>
    api.get<ListDocumentsResponse>("/api/documents"),

  save: (publicId: string, html: string) =>
    api.post<SaveDocumentResponse>("/api/documents/save", { publicId, html }),

  delete: (publicId: string) =>
    api.delete<DeleteDocumentResponse>("/api/documents", { publicId }),
};
