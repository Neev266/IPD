import { api } from "./api";

export interface UploadResponse {
  success: boolean;
  message: string;
  fileName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  html: string;
}

export interface ParseUrlResponse {
  success: boolean;
  message: string;
  html: string;
}

export const uploadApi = {
  upload: (formData: FormData) =>
    api.post<UploadResponse>("/api/upload", formData),

  parseUrl: (url: string, fileName: string) =>
    api.post<ParseUrlResponse>("/api/upload/parse-url", { url, fileName }),
};
