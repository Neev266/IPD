import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/services/authApi";

type AuthContextValue = {
  user: { id: string; email: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AUTH] Initializing auth state from localStorage...");
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        console.log("[AUTH] Restored session for user:", parsed.email);
        setUser(parsed);
      } catch (e) {
        console.error("[AUTH] Failed to parse stored user session, clearing credentials.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      console.log("[AUTH] No active session found.");
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("[AUTH] Sign in request started for email:", email);
    try {
      const data = await authApi.login(email, password);
      console.log("[AUTH] Sign in request succeeded for user ID:", data.user.id);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return {};
    } catch (err: any) {
      console.error("[AUTH] Sign in request failed:", err.message);
      return { error: err.message || "Failed to connect to auth server" };
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("[AUTH] Sign up request started for email:", email);
    try {
      const data = await authApi.signup(email, password);
      console.log("[AUTH] Sign up request succeeded for user ID:", data.user.id);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return {};
    } catch (err: any) {
      console.error("[AUTH] Sign up request failed:", err.message);
      return { error: err.message || "Failed to connect to auth server" };
    }
  };

  const signOut = async () => {
    console.log("[AUTH] Signing out user:", user?.email);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), loading, signIn, signUp, signOut }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
