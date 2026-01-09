/**
 * API functions for job applications
 */
import { API_ENDPOINTS } from "@/config/api";

export interface JobApplicationResponse {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  expected_salary: number | null;
  availability_date: string | null;
  additional_notes: string | null;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationListResponse {
  applications: JobApplicationResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

/**
 * Get all applications for a specific job (employer only)
 */
export const getJobApplications = async (
  jobId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<JobApplicationListResponse> => {
  const response = await fetch(
    `${API_ENDPOINTS.JOBS.JOB_APPLICATIONS(jobId)}?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch job applications");
  }

  return response.json();
};

/**
 * Get all applications submitted by the current user
 */
export const getMyApplications = async (
  page: number = 1,
  pageSize: number = 10
): Promise<JobApplicationListResponse> => {
  const response = await fetch(
    `${API_ENDPOINTS.JOBS.MY_APPLICATIONS}?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch my applications");
  }

  return response.json();
};

/**
 * Apply for a job
 */
export interface ApplyForJobRequest {
  resume: File;
  cover_letter?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  expected_salary?: number;
  availability_date?: string;
  additional_notes?: string;
}

export const applyForJob = async (
  jobId: string,
  data: ApplyForJobRequest
): Promise<JobApplicationResponse> => {
  const formData = new FormData();
  
  // Append resume file
  formData.append("resume", data.resume);
  
  // Append optional fields only if they have values
  if (data.cover_letter) {
    formData.append("cover_letter", data.cover_letter);
  }
  if (data.portfolio_url) {
    formData.append("portfolio_url", data.portfolio_url);
  }
  if (data.linkedin_url) {
    formData.append("linkedin_url", data.linkedin_url);
  }
  if (data.github_url) {
    formData.append("github_url", data.github_url);
  }
  if (data.expected_salary !== undefined && data.expected_salary !== null) {
    formData.append("expected_salary", data.expected_salary.toString());
  }
  if (data.availability_date) {
    formData.append("availability_date", data.availability_date);
  }
  if (data.additional_notes) {
    formData.append("additional_notes", data.additional_notes);
  }

  const response = await fetch(API_ENDPOINTS.JOBS.APPLY_FOR_JOB(jobId), {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to submit application");
  }

  return response.json();
};

/**
 * Accept a job application
 */
export const acceptApplication = async (
  applicationId: string,
  jobId: string
): Promise<JobApplicationResponse> => {
  const response = await fetch(
    `${API_ENDPOINTS.JOBS.ACCEPT_APPLICATION(applicationId)}?job_id=${jobId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to accept application");
  }

  return response.json();
};

/**
 * Reject a job application
 */
export const rejectApplication = async (
  applicationId: string,
  jobId: string
): Promise<JobApplicationResponse> => {
  const response = await fetch(
    `${API_ENDPOINTS.JOBS.REJECT_APPLICATION(applicationId)}?job_id=${jobId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to reject application");
  }

  return response.json();
};

/**
 * Delete a job application
 */
export const deleteApplication = async (
  applicationId: string,
  jobId: string
): Promise<void> => {
  const response = await fetch(
    `${API_ENDPOINTS.JOBS.DELETE_APPLICATION(applicationId)}?job_id=${jobId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to delete application");
  }
};

