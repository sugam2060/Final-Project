import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";

const API_BASE_URL = "http://localhost:8000";

/**
 * useVerifySession Hook
 *
 * Optimized version that:
 * 1. Integrates with Zustand store for user state
 * 2. Verifies session via backend API on mount
 * 3. Uses cookie-based authentication (withCredentials)
 * 4. Updates store with user data on successful verification
 * 5. Redirects to home on failure
 */
export const useVerifySession = () => {
  const { user, fetchUser, initialized } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        // Verify session and fetch user data
        const response = await fetch(
          `${API_BASE_URL}/api/auth/get-current-user`,
          {
            credentials: "include",
            method: "GET",
          }
        );

        if (!isMounted) return;

        if (response.ok) {
          // Session is valid, fetch full user data
          await fetchUser();
        } else {
          // Session invalid - clear user and redirect
          useUserStore.getState().clearUser();
          navigate("/");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Session verification failed:", error);
        useUserStore.getState().clearUser();
        navigate("/");
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [navigate, fetchUser]);

  // Memoize computed values
  const isLoggedIn = useMemo(() => !!user, [user]);
  const isLoading = useMemo(() => !initialized, [initialized]);

  return { isLoggedIn, isLoading };
};
