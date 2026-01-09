import { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Hook/AuthContext";
import { Spinner } from "@/components/ui/spinner";

/**
 * AIJobPosting Page Component
 * 
 * Placeholder for AI-powered job posting feature.
 * Redirects non-premium users to manual posting.
 * 
 * Features:
 * - Plan-based access control
 * - Automatic redirection
 * - Loading state
 */
const AIJobPosting = memo(function AIJobPosting() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to manual post if user has standard plan or no plan
    if (!user || user.plan === "standard") {
      navigate("/post/manual-post", { replace: true });
    }
  }, [user, navigate]);

  // Show loading or nothing while redirecting
  if (!user || user.plan === "standard") {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-live="polite"
        aria-label="Redirecting"
      >
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5" aria-hidden="true" />
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-black mb-4">AI Job Posting</h1>
      <p className="text-muted-foreground">
        AI-powered job posting feature coming soon.
      </p>
    </div>
  );
});

AIJobPosting.displayName = "AIJobPosting";

export default AIJobPosting;