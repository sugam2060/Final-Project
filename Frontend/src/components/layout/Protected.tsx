import { memo, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useVerifySession } from "@/Hook/useGetUser";
import { useNavigate } from "react-router-dom";

interface ProtectedProps {
  children: React.ReactNode;
}

/**
 * Protected Component
 * 
 * Route protection wrapper that requires authentication.
 * 
 * Features:
 * - Session verification
 * - Loading state
 * - Automatic redirect on auth failure
 */
const Protected = memo(function Protected({ children }: ProtectedProps) {
  const { isLoggedIn, isLoading } = useVerifySession();
  const navigate = useNavigate();

  // Redirect on auth failure
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/");
    }
  }, [isLoading, isLoggedIn, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        role="status"
        aria-live="polite"
        aria-label="Verifying session"
      >
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">
            Verifying session…
          </span>
        </div>
      </div>
    );
  }

  // Auth failed - redirect will happen via useEffect
  if (!isLoggedIn) {
    return null;
  }

  // Auth success
  return <>{children}</>;
});

Protected.displayName = "Protected";

export default Protected;
