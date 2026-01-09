const API_BASE_URL = "http://localhost:8000";

export interface JobCreateRequest {
  title: string;
  company_name: string;
  location: string;
  work_mode?: "remote" | "hybrid" | "onsite";
  description: string;
  employment_type: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  experience_level: "entry" | "mid" | "senior" | "executive";
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  is_salary_negotiable?: boolean;
  category?: string;
  industry?: string;
  application_deadline?: string; // ISO datetime string
  expires_at?: string; // ISO datetime string
  status?: "draft" | "published" | "closed" | "expired";
  is_featured?: boolean;
}

export interface JobResponse {
  id: string;
  title: string;
  company_name: string;
  location: string;
  work_mode: string;
  description: string;
  employment_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string | null;
  is_salary_negotiable: boolean;
  category: string | null;
  industry: string | null;
  application_deadline: string | null;
  expires_at: string | null;
  published_at: string | null;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  application_count: number;
  employer_id: string;
  created_at: string;
  updated_at: string;
}

export interface JobsListResponse {
  jobs: JobResponse[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export const createJob = async (
  data: JobCreateRequest
): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create job posting");
  }

  return response.json();
};

export const getMyJobs = async (
  page: number = 1,
  pageSize: number = 10
): Promise<JobsListResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/my-jobs?page=${page}&page_size=${pageSize}`,
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
    throw new Error(error.detail || "Failed to fetch jobs");
  }

  return response.json();
};

export const getJob = async (jobId: string): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch job");
  }

  return response.json();
};

export interface JobUpdateRequest {
  title?: string;
  company_name?: string;
  location?: string;
  work_mode?: "remote" | "hybrid" | "onsite";
  description?: string;
  employment_type?: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  experience_level?: "entry" | "mid" | "senior" | "executive";
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  is_salary_negotiable?: boolean;
  category?: string;
  industry?: string;
  application_deadline?: string; // ISO datetime string
  expires_at?: string; // ISO datetime string
  status?: "draft" | "published" | "closed" | "expired";
  is_featured?: boolean;
}

export const updateJob = async (
  jobId: string,
  data: JobUpdateRequest
): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to update job");
  }

  return response.json();
};

export const updateJobStatus = async (
  jobId: string,
  status: "draft" | "published" | "closed" | "expired"
): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to update job status");
  }

  return response.json();
};

/**
 * Delete a job posting
 */
export const deleteJob = async (jobId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to delete job");
  }
};

// Public job listing API (no authentication required)
export interface PublicJobsFilters {
  category?: string;
  employment_type?: string;
  experience_level?: string;
  work_mode?: string;
  location?: string;
}

export const getPublicJobs = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: PublicJobsFilters
): Promise<JobsListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (filters?.category) params.append("category", filters.category);
  if (filters?.employment_type) params.append("employment_type", filters.employment_type);
  if (filters?.experience_level) params.append("experience_level", filters.experience_level);
  if (filters?.work_mode) params.append("work_mode", filters.work_mode);
  if (filters?.location) params.append("location", filters.location);

  const response = await fetch(
    `${API_BASE_URL}/api/jobs/public?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch jobs");
  }

  return response.json();
};

export const getPublicJob = async (jobId: string): Promise<JobResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/public/${jobId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch job");
  }

  return response.json();
};

