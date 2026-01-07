import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/**
 * useVerifySession Hook
 *
 * Logic:
 * 1. On mount, verifies the current session via backend API.
 * 2. Uses cookie-based authentication (withCredentials).
 * 3. If API returns 200 → user is logged in.
 * 4. On failure (401 / 403 / 500):
 *    - Mark user as logged out
 *    - Redirect to landing/login page
 */
export const useVerifySession = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/auth/get-current-user",
          {
            withCredentials: true,
          }
        );

        if (response.status === 200) {
          setIsLoggedIn(true);
        } else {
          throw new Error("Session invalid");
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        setIsLoggedIn(false);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [navigate]);

  return { isLoggedIn, isLoading };
};
