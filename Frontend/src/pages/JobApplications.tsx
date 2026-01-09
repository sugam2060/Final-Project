import { memo, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { getJobApplications, acceptApplication, rejectApplication, deleteApplication, type JobApplicationResponse } from "@/api/application";
import { getJob } from "@/api/job";
import { FiArrowLeft, FiFileText, FiExternalLink, FiCalendar, FiDollarSign, FiUser, FiCheck, FiX, FiTrash2 } from "react-icons/fi";

/**
 * Format date string to readable format
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return "N/A";
  }
}

/**
 * Format date and time string to readable format
 */
function formatDateTime(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  } catch {
    return "N/A";
  }
}

/**
 * Application Status Badge Component
 */
const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const statusConfig = useMemo(() => {
    switch (status.toLowerCase()) {
      case "pending":
        return { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
      case "reviewing":
        return { label: "Reviewing", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
      case "shortlisted":
        return { label: "Shortlisted", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
      case "rejected":
        return { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
      case "accepted":
        return { label: "Accepted", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" };
      case "withdrawn":
        return { label: "Withdrawn", className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" };
    }
  }, [status]);

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.className}`}
      aria-label={`Application status: ${statusConfig.label}`}
    >
      {statusConfig.label}
    </span>
  );
});

/**
 * Application Card Component
 */
const ApplicationCard = memo(function ApplicationCard({
  application,
  jobId,
}: {
  application: JobApplicationResponse;
  jobId: string;
}) {
  const queryClient = useQueryClient();

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: () => acceptApplication(application.id, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
      toast.success("Application accepted!", {
        description: "The application status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to accept application", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => rejectApplication(application.id, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
      toast.success("Application rejected", {
        description: "The application status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to reject application", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(application.id, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      toast.success("Application deleted", {
        description: "The application and resume have been removed.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete application", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleAccept = useCallback(() => {
    if (window.confirm("Are you sure you want to accept this application?")) {
      acceptMutation.mutate();
    }
  }, [acceptMutation]);

  const handleReject = useCallback(() => {
    if (window.confirm("Are you sure you want to reject this application?")) {
      rejectMutation.mutate();
    }
  }, [rejectMutation]);

  const handleDelete = useCallback(() => {
    if (window.confirm("Are you sure you want to delete this application? This action cannot be undone and will also delete the resume from Cloudinary.")) {
      deleteMutation.mutate();
    }
  }, [deleteMutation]);

  const isPending = application.status === "pending";
  const isLoading = acceptMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

  return (
    <article className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FiUser className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-semibold text-lg">Application #{application.id.slice(0, 8)}</p>
              <p className="text-sm text-muted-foreground">
                Applied on {formatDate(application.created_at)}
              </p>
            </div>
          </div>
          <div className="mb-3">
            <StatusBadge status={application.status} />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {isPending && (
            <>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={handleAccept}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
                aria-label="Accept application"
              >
                {acceptMutation.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <>
                    <FiCheck className="mr-1" size={16} />
                    Accept
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading}
                aria-label="Reject application"
              >
                {rejectMutation.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <>
                    <FiX className="mr-1" size={16} />
                    Reject
                  </>
                )}
              </Button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            aria-label="Delete application"
          >
            {deleteMutation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <FiTrash2 className="mr-1" size={16} />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cover Letter */}
      {application.cover_letter && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FiFileText className="text-primary" size={16} />
            Cover Letter
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {application.cover_letter}
          </p>
        </div>
      )}

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {application.expected_salary && (
          <div className="flex items-center gap-2 text-sm">
            <FiDollarSign className="text-muted-foreground" size={16} />
            <span className="text-muted-foreground">Expected Salary:</span>
            <span className="font-semibold">₹{application.expected_salary.toLocaleString()}</span>
          </div>
        )}

        {application.availability_date && (
          <div className="flex items-center gap-2 text-sm">
            <FiCalendar className="text-muted-foreground" size={16} />
            <span className="text-muted-foreground">Available from:</span>
            <span className="font-semibold">{formatDate(application.availability_date)}</span>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 mb-4">
        {application.resume_url && (
          <a
            href={application.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            aria-label="View resume PDF"
          >
            <FiFileText size={16} />
            View Resume
            <FiExternalLink size={12} />
          </a>
        )}
        {application.portfolio_url && (
          <a
            href={application.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            aria-label="View portfolio"
          >
            Portfolio
            <FiExternalLink size={12} />
          </a>
        )}
        {application.linkedin_url && (
          <a
            href={application.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            aria-label="View LinkedIn profile"
          >
            LinkedIn
            <FiExternalLink size={12} />
          </a>
        )}
        {application.github_url && (
          <a
            href={application.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            aria-label="View GitHub profile"
          >
            GitHub
            <FiExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Additional Notes */}
      {application.additional_notes && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-1">Additional Notes</h4>
          <p className="text-sm text-muted-foreground">{application.additional_notes}</p>
        </div>
      )}

      {/* Review Information */}
      {application.reviewed_at && (
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>Reviewed on {formatDateTime(application.reviewed_at)}</p>
          {application.review_notes && (
            <p className="mt-1 italic">"{application.review_notes}"</p>
          )}
        </div>
      )}
    </article>
  );
});

/**
 * JobApplications Page Component
 * 
 * Displays all applications for a specific job posting (employer view).
 * 
 * Features:
 * - Job details header
 * - Application list with pagination
 * - Application details (resume, cover letter, links)
 * - Status badges
 * - Error handling
 */
function JobApplications() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch job details
  const {
    data: job,
    isLoading: isLoadingJob,
    isError: isJobError,
    error: jobError,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id!),
    enabled: !!id,
  });

  // Fetch applications
  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    isError: isApplicationsError,
    error: applicationsError,
  } = useQuery({
    queryKey: ["job-applications", id],
    queryFn: () => getJobApplications(id!, 1, 50), // Get first 50 applications
    enabled: !!id,
  });

  const handleBack = () => {
    navigate("/jobs");
  };

  if (isLoadingJob || isLoadingApplications) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isJobError || isApplicationsError) {
    const errorMessage =
      (jobError as Error)?.message ||
      (applicationsError as Error)?.message ||
      "An unexpected error occurred";

    return (
      <div className="max-w-6xl mx-auto py-10 px-4 text-center" role="alert" aria-live="assertive">
        <h1 className="text-3xl font-black mb-4">Error Loading Applications</h1>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleBack} aria-label="Back to jobs">Back to Jobs</Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            aria-label="Reload page"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-black mb-4">Job Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The job you are looking for does not exist.
        </p>
        <Button onClick={handleBack} aria-label="Back to jobs">Back to Jobs</Button>
      </div>
    );
  }

  const applications = applicationsData?.applications ?? [];
  const totalApplications = applicationsData?.total ?? 0;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="mb-6"
        aria-label="Back to jobs"
      >
        <FiArrowLeft className="mr-2" />
        Back to Jobs
      </Button>

      {/* Job Header */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-black mb-2">{job.title}</h1>
        <p className="text-xl text-muted-foreground font-semibold mb-4">
          {job.company_name}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>📍 {job.location}</span>
          <span>•</span>
          <span>{job.work_mode}</span>
          <span>•</span>
          <span>{totalApplications} application{totalApplications !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Applications List */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Applications</h2>
        {applications.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-2">No applications yet</p>
            <p className="text-sm text-muted-foreground">
              Applications submitted for this job will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} jobId={id!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(JobApplications);

