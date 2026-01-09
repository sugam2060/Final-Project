import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicJob } from "@/api/job";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return "N/A";
  }
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["public-job", id],
    queryFn: () => getPublicJob(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-black mb-4">Error Loading Job</h1>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "An unexpected error occurred"}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/jobs/browse")}>Browse Jobs</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-black mb-4">Job Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The job you are looking for does not exist or is no longer available.
        </p>
        <Button onClick={() => navigate("/jobs/browse")}>Browse Jobs</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/jobs/browse")}
        className="mb-6"
      >
        ← Back to Jobs
      </Button>

      <div className="bg-card border rounded-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">{job.title}</h1>
                {job.is_featured && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-xl text-muted-foreground font-semibold mb-2">
                {job.company_name}
              </p>
              <p className="text-muted-foreground">
                📍 {job.location} • {job.work_mode}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              {job.employment_type}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              {job.experience_level}
            </span>
            {job.category && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                {job.category}
              </span>
            )}
            {job.industry && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                {job.industry}
              </span>
            )}
          </div>

          {job.salary_min && job.salary_max && (
            <div className="mb-4">
              <span className="text-muted-foreground">Salary: </span>
              <span className="font-semibold text-lg">
                {job.salary_currency} {job.salary_min.toLocaleString()} -{" "}
                {job.salary_max.toLocaleString()}
                {job.salary_period && ` ${job.salary_period}`}
                {job.is_salary_negotiable && " (Negotiable)"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Posted:</span> {formatDate(job.published_at)}
            </div>
            {job.application_deadline && (
              <div>
                <span className="font-medium">Deadline:</span>{" "}
                {formatDate(job.application_deadline)}
              </div>
            )}
            <div>
              <span className="font-medium">Views:</span> {job.view_count}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold mt-6 mb-4 text-foreground" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-bold mt-5 mb-3 text-foreground" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-muted-foreground mb-4 leading-relaxed" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-foreground" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 space-y-2 my-4" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 space-y-2 my-4" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-muted-foreground" {...props} />
                ),
              }}
            >
              {job.description}
            </ReactMarkdown>
          </div>
        </div>

        {/* Apply Button */}
        <div className="border-t pt-6">
          <Button size="lg" className="w-full md:w-auto">
            Apply for this Job
          </Button>
        </div>
      </div>
    </div>
  );
}

