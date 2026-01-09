import { memo } from "react";

interface ViewJobsErrorProps {
  error: Error | null;
}

/**
 * ViewJobsError Component
 * 
 * Displays error message when job loading fails.
 * 
 * Features:
 * - User-friendly error messages
 * - Accessible error display
 */
export const ViewJobsError = memo(function ViewJobsError({ error }: ViewJobsErrorProps) {
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

  return (
    <div className="max-w-6xl mx-auto py-10 px-4" role="alert" aria-live="assertive">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Error Loading Jobs</h2>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>
    </div>
  );
})

