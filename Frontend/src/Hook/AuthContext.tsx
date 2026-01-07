import { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  email_verified?: boolean;
  role: "employer" | "employee" | "both";
  plan: "standard" | "premium"
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  // ---------------------------------------------
  // Bootstrap auth state (runs ONCE)
  // ---------------------------------------------
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const raw = localStorage.getItem("user");

        if (raw) {
          setUser(JSON.parse(raw));
          return;
        }

        // No local user → ask backend
        const res = await fetch("http://localhost:8000/api/auth/me", {
          credentials: "include", // IMPORTANT if using cookies
        });

        if (!res.ok) {
          return;
        }

        const data: User = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        console.error("Auth bootstrap failed", err);
      } finally {
        setInitialized(true);
      }
    };

    bootstrapAuth();
  }, []);

  // ---------------------------------------------
  // Keep localStorage in sync
  // ---------------------------------------------
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
