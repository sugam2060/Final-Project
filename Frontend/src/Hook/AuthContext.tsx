import { useEffect } from "react";
import { useUserStore, type User } from "@/stores/useUserStore";

// Re-export User type for backward compatibility
export type { User };

interface UseAuthReturn {
  user: User | null;
  setUser: (user: User | null) => void;
  initialized: boolean;
  fetchUser: () => Promise<void>;
}

/**
 * Custom hook for authentication using Zustand store
 * 
 * This hook:
 * - Initializes user state from localStorage or backend on mount
 * - Provides user state and setter function
 * - Automatically stores user info to Zustand store after login
 */
export const useAuth = (): UseAuthReturn => {
  const { user, setUser, initialized, initialize, fetchUser } = useUserStore();

  // ---------------------------------------------
  // Bootstrap auth state (runs ONCE on mount)
  // ---------------------------------------------
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // ---------------------------------------------
  // Wrapper for setUser that ensures store is updated
  // ---------------------------------------------
  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    // Store is automatically persisted via Zustand persist middleware
  };

  return {
    user,
    setUser: handleSetUser,
    initialized,
    fetchUser, // Expose fetchUser to fetch user after login
  };
};
