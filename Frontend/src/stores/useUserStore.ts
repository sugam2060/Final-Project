import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  email_verified?: boolean;
  role: "employer" | "employee" | "both";
  plan: "standard" | "premium";
}

interface UserState {
  user: User | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  initialize: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      initialized: false,
      
      setUser: (user) => set({ user }),
      
      clearUser: () => set({ user: null }),
      
      initialize: async () => {
        try {
          // If user already exists (from localStorage via persist), mark as initialized
          const currentUser = get().user;
          if (currentUser) {
            set({ initialized: true });
            return;
          }

          // No local user → fetch from backend
          const res = await fetch("http://localhost:8000/api/auth/me", {
            credentials: "include",
          });

          if (res.ok) {
            const data: User = await res.json();
            set({ user: data, initialized: true });
          } else {
            set({ user: null, initialized: true });
          }
        } catch (err) {
          console.error("User initialization failed", err);
          set({ user: null, initialized: true });
        }
      },

      fetchUser: async () => {
        try {
          // Fetch user from backend (useful after login)
          const res = await fetch("http://localhost:8000/api/auth/me", {
            credentials: "include",
          });

          if (res.ok) {
            const data: User = await res.json();
            set({ user: data });
          } else {
            set({ user: null });
          }
        } catch (err) {
          console.error("Failed to fetch user", err);
          set({ user: null });
        }
      },
    }),
    {
      name: "user-storage", // localStorage key
      partialize: (state) => ({ user: state.user }), // Only persist user, not initialized
    }
  )
);

