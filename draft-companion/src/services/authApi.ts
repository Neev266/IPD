import { api } from "./api";

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),

  signup: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/signup", { email, password }),
};
