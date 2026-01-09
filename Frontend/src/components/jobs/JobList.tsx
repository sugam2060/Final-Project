import { memo } from "react";
import type { JobResponse } from "@/api/job";
import { JobCard } from "./JobCard";

interface JobListProps {
  jobs: JobResponse[];
}

/**
 * JobList Component
 * 
 * Displays a list of job postings.
 * 
 * Features:
 * - Empty state handling
 * - Optimized rendering with memoized cards
 */
export const JobList = memo(function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg" role="status" aria-live="polite">
        <p className="text-muted-foreground mb-4">No jobs found</p>
        <p className="text-sm text-muted-foreground">
          Start by creating your first job posting!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="list" aria-label="Job postings">
      {jobs.map((job) => (
        <div key={job.id} role="listitem">
          <JobCard job={job} />
        </div>
      ))}
    </div>
  );
})

