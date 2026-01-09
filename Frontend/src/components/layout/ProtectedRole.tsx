import React from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useVerifySession } from "@/Hook/useGetUser";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";

interface ProtectedRoleProps {
  children: React.ReactNode;
  requiredRole: "employer" | "employee" | "both";
}

const ProtectedRole: React.FC<ProtectedRoleProps> = ({ children, requiredRole }) => {
  const { isLoggedIn, isLoading } = useVerifySession();
  const { user } = useUserStore();
  const navigate = useNavigate();

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5" />
          <span className="text-sm font-medium text-muted-foreground">
            Verifying session…
          </span>
        </div>
      </div>
    );
  }

  // 2. Auth failed
  if (!isLoggedIn) {
    navigate("/");
    return null;
  }

  // 3. Check role
  if (user?.role !== requiredRole) {
    toast.error("Access Denied", {
      description: `This page is only accessible to users with "${requiredRole}" role.`,
    });
    navigate("/");
    return null;
  }

  // 4. Access granted
  return <>{children}</>;
};

export default ProtectedRole;

