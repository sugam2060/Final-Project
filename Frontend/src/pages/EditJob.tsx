import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJob, updateJob, type JobUpdateRequest } from "@/api/job";
import { CreateJobForm, DraftPublishActions } from "@/components/create_job";
import type { JobFormValues } from "@/components/create_job";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useMemo, useRef } from "react";
import type { CreateJobFormInstance } from "@/components/create_job";

export default function EditJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<CreateJobFormInstance | null>(null);

  // Fetch job data
  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id!),
    enabled: !!id,
  });

  // Update job mutation (includes status updates)
  const updateMutation = useMutation({
    mutationFn: (data: JobUpdateRequest) => updateJob(id!, data),
    onSuccess: (response, variables) => {
      const statusText = variables.status === "published" 
        ? "published" 
        : variables.status === "draft" 
        ? "saved as draft" 
        : "updated";
      toast.success(`Job ${statusText} successfully!`, {
        description: `Job "${response.title}" has been ${statusText}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update job", {
        description: error.message,
      });
    },
  });

  // Determine which action is in progress based on mutation variables
  const isSavingDraft = updateMutation.isPending && updateMutation.variables?.status === "draft";
  const isPublishing = updateMutation.isPending && updateMutation.variables?.status === "published";

  // Convert job data to form values
  const defaultValues = useMemo<Partial<JobFormValues>>(() => {
    if (!job) return {};

    return {
      jobTitle: job.title,
      companyName: job.company_name,
      location: job.location,
      workMode: job.work_mode as "remote" | "hybrid" | "onsite",
      employmentType: job.employment_type as any,
      experienceLevel: job.experience_level as any,
      category: job.category || "",
      industry: job.industry || "",
      salaryMin: job.salary_min ?? undefined,
      salaryMax: job.salary_max ?? undefined,
      salaryCurrency: job.salary_currency,
      salaryPeriod: job.salary_period || "",
      isSalaryNegotiable: job.is_salary_negotiable,
      applicationDeadline: job.application_deadline
        ? new Date(job.application_deadline).toISOString().split("T")[0]
        : "",
      expiresAt: job.expires_at
        ? new Date(job.expires_at).toISOString().split("T")[0]
        : "",
      description: job.description,
    };
  }, [job]);

  const handleSubmit = (values: JobFormValues) => {
    const jobData: JobUpdateRequest = {
      title: values.jobTitle,
      company_name: values.companyName,
      location: values.location,
      work_mode: values.workMode,
      description: values.description,
      employment_type: values.employmentType,
      experience_level: values.experienceLevel,
      category: values.category || undefined,
      industry: values.industry || undefined,
      salary_min: values.salaryMin && values.salaryMin !== "" ? Number(values.salaryMin) : undefined,
      salary_max: values.salaryMax && values.salaryMax !== "" ? Number(values.salaryMax) : undefined,
      salary_currency: values.salaryCurrency,
      salary_period: values.salaryPeriod || undefined,
      is_salary_negotiable: values.isSalaryNegotiable,
      application_deadline: values.applicationDeadline
        ? new Date(values.applicationDeadline).toISOString()
        : undefined,
      expires_at: values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : undefined,
    };

    updateMutation.mutate(jobData);
  };

  // Helper function to create job data from form values
  function createJobDataFromForm(values: JobFormValues, status?: "draft" | "published"): JobUpdateRequest {
    return {
      title: values.jobTitle,
      company_name: values.companyName,
      location: values.location,
      work_mode: values.workMode,
      description: values.description,
      employment_type: values.employmentType,
      experience_level: values.experienceLevel,
      category: values.category || undefined,
      industry: values.industry || undefined,
      salary_min: values.salaryMin && values.salaryMin !== "" ? Number(values.salaryMin) : undefined,
      salary_max: values.salaryMax && values.salaryMax !== "" ? Number(values.salaryMax) : undefined,
      salary_currency: values.salaryCurrency,
      salary_period: values.salaryPeriod || undefined,
      is_salary_negotiable: values.isSalaryNegotiable,
      application_deadline: values.applicationDeadline
        ? new Date(values.applicationDeadline).toISOString()
        : undefined,
      expires_at: values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : undefined,
      status, // Include status in the update request
    };
  }

  async function handleSaveDraft() {
    if (!formRef.current) return;
    
    const isValid = await formRef.current.trigger();
    if (!isValid) {
      toast.error("Please fix form errors before saving");
      return;
    }

    const values = formRef.current.getValues();
    const jobData = createJobDataFromForm(values, "draft");
    
    // Update job data and status in a single call
    updateMutation.mutate(jobData);
  }

  async function handlePublish() {
    if (!formRef.current) return;
    
    const isValid = await formRef.current.trigger();
    if (!isValid) {
      toast.error("Please fix form errors before publishing");
      return;
    }

    const values = formRef.current.getValues();
    const jobData = createJobDataFromForm(values, "published");
    
    // Update job data and status in a single call
    updateMutation.mutate(jobData);
  }

  const handleCancel = () => {
    navigate("/jobs");
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Error Loading Job</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <Button onClick={handleCancel}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Edit Job Posting</h1>
        <p className="text-muted-foreground">
          Update your job posting details below.
        </p>
      </div>

      <CreateJobForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
        onFormReady={(form) => {
          formRef.current = form;
        }}
        customActions={
          <DraftPublishActions
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
            isSavingDraft={isSavingDraft}
            isPublishing={isPublishing}
            currentStatus={job.status as "draft" | "published" | "closed" | "expired"}
          />
        }
      />
    </div>
  );
}

