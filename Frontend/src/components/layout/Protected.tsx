import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { useVerifySession } from "@/Hook/useGetUser";
import { useNavigate } from "react-router-dom";

interface ProtectedProps {
  children: React.ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useVerifySession();
  const navigate = useNavigate()

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

  // 2. Auth failed (redirect handled in hook)
  if (!isLoggedIn) {
    navigate("/")
  }

  // 3. Auth success
  return <>{children}</>;
};

export default Protected;
