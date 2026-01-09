import { memo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FiArrowLeft } from "react-icons/fi";
import { getPublicJob } from "@/api/job";
import { applyForJob, type ApplyForJobRequest } from "@/api/application";
import { ApplicationForm, type ApplicationFormValues } from "@/components/application/ApplicationForm";
import { useAuth } from "@/Hook/AuthContext";

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
 * ApplyJob Page Component
 * 
 * Allows users to apply for a job posting by filling out a form and uploading a resume.
 * 
 * Features:
 * - Job details display
 * - Application form with resume upload
 * - Form validation
 * - Error handling
 */
function ApplyJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch job details
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

  // Application submission mutation
  const applyMutation = useMutation({
    mutationFn: (data: ApplyForJobRequest) => applyForJob(id!, data),
    onSuccess: () => {
      toast.success("Application submitted successfully!", {
        description: "Your application has been sent to the employer.",
      });
      navigate(`/jobs/view/${id}`);
    },
    onError: (error: Error) => {
      toast.error("Failed to submit application", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleBack = useCallback(() => {
    navigate(`/jobs/view/${id}`);
  }, [navigate, id]);

  const handleSubmit = useCallback(
    async (values: ApplicationFormValues) => {
      if (!user) {
        toast.error("Please login to apply for jobs");
        navigate("/login");
        return;
      }

      // Convert form values to API request format
      const applicationData: ApplyForJobRequest = {
        resume: values.resume,
        cover_letter: values.cover_letter || undefined,
        portfolio_url: values.portfolio_url || undefined,
        linkedin_url: values.linkedin_url || undefined,
        github_url: values.github_url || undefined,
        expected_salary: values.expected_salary,
        availability_date: values.availability_date || undefined,
        additional_notes: values.additional_notes || undefined,
      };

      await applyMutation.mutateAsync(applicationData);
    },
    [user, applyMutation, navigate]
  );

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
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center" role="alert" aria-live="assertive">
        <h1 className="text-3xl font-black mb-4">Error Loading Job</h1>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleBack} aria-label="Back to job details">Back to Job</Button>
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
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-black mb-4">Job Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The job you are looking for does not exist or is no longer available.
        </p>
        <Button onClick={() => navigate("/jobs/browse")} aria-label="Browse jobs">
          Browse Jobs
        </Button>
      </div>
    );
  }

  // Check if job is still accepting applications
  const currentDate = new Date();
  const deadlineDate = job.application_deadline ? new Date(job.application_deadline) : null;
  const isDeadlinePassed = deadlineDate && deadlineDate < currentDate;
  const isExpired = job.expires_at ? new Date(job.expires_at) < currentDate : false;
  const canApply = job.status === "published" && !isDeadlinePassed && !isExpired;

  if (!canApply) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
          aria-label="Back to job details"
        >
          <FiArrowLeft className="mr-2" />
          Back to Job
        </Button>
        <div className="bg-card border rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Applications Closed</h1>
          <p className="text-muted-foreground mb-4">
            {isDeadlinePassed
              ? `The application deadline was ${formatDate(job.application_deadline)}.`
              : isExpired
              ? "This job posting has expired."
              : "This job is not currently accepting applications."}
          </p>
          <Button onClick={handleBack} aria-label="Back to job details">
            View Job Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="mb-6"
        aria-label="Back to job details"
      >
        <FiArrowLeft className="mr-2" />
        Back to Job
      </Button>

      {/* Job Summary */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-black mb-2">{job.title}</h1>
        <p className="text-xl text-muted-foreground font-semibold mb-4">
          {job.company_name}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>📍 {job.location}</span>
          <span>•</span>
          <span>{job.work_mode}</span>
          {job.application_deadline && (
            <>
              <span>•</span>
              <span>Deadline: {formatDate(job.application_deadline)}</span>
            </>
          )}
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Application Form</h2>
        <ApplicationForm
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isSubmitting={applyMutation.isPending}
        />
      </div>
    </div>
  );
}

export default memo(ApplyJob);

