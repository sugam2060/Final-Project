import type { JobResponse } from "@/api/job";
import { JobCard } from "./JobCard";

interface JobListProps {
  jobs: JobResponse[];
}

export function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">No jobs found</p>
        <p className="text-sm text-muted-foreground">
          Start by creating your first job posting!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

