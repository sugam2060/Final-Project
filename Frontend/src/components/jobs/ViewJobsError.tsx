interface ViewJobsErrorProps {
  error: Error | null;
}

export function ViewJobsError({ error }: ViewJobsErrorProps) {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Error Loading Jobs</h2>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "An unexpected error occurred"}
        </p>
      </div>
    </div>
  );
}

