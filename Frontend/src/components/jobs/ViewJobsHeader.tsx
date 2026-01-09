import { memo, useMemo } from "react";

interface ViewJobsHeaderProps {
  totalJobs: number;
}

/**
 * ViewJobsHeader Component
 * 
 * Displays header for the jobs listing page.
 * 
 * Features:
 * - Dynamic job count display
 * - Proper pluralization
 */
export const ViewJobsHeader = memo(function ViewJobsHeader({ totalJobs }: ViewJobsHeaderProps) {
  const description = useMemo(() => {
    if (totalJobs === 0) {
      return "You haven't posted any jobs yet";
    }
    return `You have ${totalJobs} job posting${totalJobs !== 1 ? "s" : ""}`;
  }, [totalJobs]);

  return (
    <header className="mb-8">
      <h1 className="text-3xl font-black mb-2">My Job Postings</h1>
      <p className="text-muted-foreground">{description}</p>
    </header>
  );
})

