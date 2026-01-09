import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateJobStatus } from "@/api/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { JobResponse } from "@/api/job";

interface JobCardProps {
  job: JobResponse;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return "N/A";
  }
}

export function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: () => updateJobStatus(job.id, "published"),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      toast.success("Job published!", {
        description: `Job "${response.title}" is now published.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to publish job", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleClick = () => {
    navigate(`/job/${job.id}`);
  };

  const handlePublish = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    updateStatusMutation.mutate();
  };

  const isPublished = job.status === "published";
  const isUpdating = updateStatusMutation.isPending;

  return (
    <div
      className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold">{job.title}</h2>
            <JobStatusBadge status={job.status} />
            {job.is_featured && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Featured
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-2">
            {job.company_name} • {job.location} • {job.work_mode}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{job.employment_type}</span>
            <span>•</span>
            <span>{job.experience_level}</span>
            {job.category && (
              <>
                <span>•</span>
                <span>{job.category}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <span className="text-muted-foreground">Created: </span>
          <span>{formatDate(job.created_at)}</span>
        </div>
        {job.published_at && (
          <div>
            <span className="text-muted-foreground">Published: </span>
            <span>{formatDate(job.published_at)}</span>
          </div>
        )}
        {job.application_deadline && (
          <div>
            <span className="text-muted-foreground">Deadline: </span>
            <span>{formatDate(job.application_deadline)}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Views: </span>
          <span>{job.view_count}</span>
          <span className="text-muted-foreground ml-4">Applications: </span>
          <span>{job.application_count}</span>
        </div>
      </div>

      {job.salary_min && job.salary_max && (
        <div className="mt-4 text-sm">
          <span className="text-muted-foreground">Salary: </span>
          <span>
            {job.salary_currency} {job.salary_min.toLocaleString()} -{" "}
            {job.salary_max.toLocaleString()}
            {job.salary_period && ` ${job.salary_period}`}
            {job.is_salary_negotiable && " (Negotiable)"}
          </span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t flex items-center justify-between gap-4">
        <div
          className="flex-1 cursor-pointer"
          onClick={handleClick}
        >
          <span className="text-sm text-muted-foreground hover:text-primary">
            Click to edit job details →
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            size="sm"
            onClick={handlePublish}
            disabled={isUpdating || isPublished}
          >
            {isUpdating ? <Spinner className="mr-2 h-3 w-3" /> : null}
            {isPublished ? "Published" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

