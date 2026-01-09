interface ViewJobsHeaderProps {
  totalJobs: number;
}

export function ViewJobsHeader({ totalJobs }: ViewJobsHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-black mb-2">My Job Postings</h1>
      <p className="text-muted-foreground">
        {totalJobs > 0
          ? `You have ${totalJobs} job posting${totalJobs !== 1 ? "s" : ""}`
          : "You haven't posted any jobs yet"}
      </p>
    </div>
  );
}

