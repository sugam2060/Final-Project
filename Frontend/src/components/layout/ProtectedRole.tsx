import { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useVerifySession } from "@/Hook/useGetUser";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";

interface ProtectedRoleProps {
  children: React.ReactNode;
  requiredRole: "employer" | "employee" | "both";
}

/**
 * ProtectedRole Component
 * 
 * Route protection wrapper that requires specific user role.
 * 
 * Features:
 * - Session verification
 * - Role-based access control
 * - Loading state
 * - Automatic redirect on access denial
 */
const ProtectedRole = memo(function ProtectedRole({ children, requiredRole }: ProtectedRoleProps) {
  const { isLoggedIn, isLoading } = useVerifySession();
  const { user } = useUserStore();
  const navigate = useNavigate();

  // Handle redirects
  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      navigate("/");
      return;
    }

    if (user?.role !== requiredRole) {
      toast.error("Access Denied", {
        description: `This page is only accessible to users with "${requiredRole}" role.`,
      });
      navigate("/");
    }
  }, [isLoading, isLoggedIn, user?.role, requiredRole, navigate]);

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

  // Auth failed or role mismatch - redirect will happen via useEffect
  if (!isLoggedIn || user?.role !== requiredRole) {
    return null;
  }

  // Access granted
  return <>{children}</>;
});

ProtectedRole.displayName = "ProtectedRole";

export default ProtectedRole;

