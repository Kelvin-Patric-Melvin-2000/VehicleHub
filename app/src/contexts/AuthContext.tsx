import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiJson } from "@/lib/api";
import type { AppUser } from "@/types/domain";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(u: { id: string; email: string; display_name: string | null }): AppUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ user: { id: string; email: string; display_name: string | null } }>(
          "/api/v1/auth/session",
        );
        if (!cancelled) setUser(mapUser(data.user));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const data = await apiJson<{ user: { id: string; email: string; display_name: string | null } }>(
        "/api/v1/auth/sign-up",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            display_name: displayName ?? undefined,
          }),
        },
      );
      setUser(mapUser(data.user));
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error("Sign up failed") };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiJson<{ user: { id: string; email: string; display_name: string | null } }>(
        "/api/v1/auth/sign-in",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      setUser(mapUser(data.user));
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error("Sign in failed") };
    }
  };

  const signOut = async () => {
    try {
      await apiJson("/api/v1/auth/sign-out", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
