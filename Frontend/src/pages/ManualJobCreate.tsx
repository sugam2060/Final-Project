import { memo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CreateJobForm, DraftPublishActions } from "@/components/create_job";
import type { JobFormValues, CreateJobFormInstance } from "@/components/create_job";
import { createJob, type JobCreateRequest } from "@/api/job";
import { toast } from "sonner";

/**
 * ManualJobCreate Page Component
 * 
 * Allows creating new job postings manually.
 * 
 * Features:
 * - Job creation form
 * - Draft and publish actions
 * - Form validation
 * - Error handling
 */
function ManualJobCreate() {
  const navigate = useNavigate()
  const formRef = useRef<CreateJobFormInstance | null>(null)

  const createJobMutation = useMutation({
    mutationFn: (jobData: JobCreateRequest) => createJob(jobData),
    onSuccess: (response, variables) => {
      const statusText = variables.status === "published" ? "published" : "saved as draft"
      toast.success("Job posting created successfully!", {
        description: `Job "${response.title}" has been ${statusText}.`,
      })
      navigate("/jobs")
    },
    onError: (error: Error) => {
      console.error("Error creating job:", error)
      toast.error("Failed to create job posting", {
        description: error.message || "An unexpected error occurred",
      })
    },
  })

  function createJobData(values: JobFormValues, status: "draft" | "published"): JobCreateRequest {
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
      status,
    }
  }

  async function handleSaveDraft() {
    if (!formRef.current) return
    
    const isValid = await formRef.current.trigger()
    if (!isValid) {
      toast.error("Please fix form errors before saving")
      return
    }

    const values = formRef.current.getValues()
    const jobData = createJobData(values, "draft")
    createJobMutation.mutate(jobData)
  }

  async function handlePublish() {
    if (!formRef.current) return
    
    const isValid = await formRef.current.trigger()
    if (!isValid) {
      toast.error("Please fix form errors before publishing")
      return
    }

    const values = formRef.current.getValues()
    const jobData = createJobData(values, "published")
    createJobMutation.mutate(jobData)
  }

  const handleCancel = useCallback(() => {
    navigate(-1); // Go back to previous page
  }, [navigate]);

  // This is a workaround to get the form instance
  // We'll use a callback ref approach
  const handleFormSubmit = useCallback((values: JobFormValues) => {
    // This won't be called directly, but we need it for the form
    // The actual submission is handled by the buttons
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black">Create Job Posting</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details below to post a new vacancy.
        </p>
      </div>

      <CreateJobForm 
        onSubmit={handleFormSubmit} 
        onCancel={handleCancel}
        isSubmitting={createJobMutation.isPending}
        onFormReady={(form) => {
          formRef.current = form
        }}
        customActions={
          <DraftPublishActions
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onCancel={handleCancel}
            isSubmitting={createJobMutation.isPending}
          />
        }
      />
    </div>
  );
}

export default memo(ManualJobCreate);
