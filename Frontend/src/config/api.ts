/**
 * Centralized API configuration for the frontend.
 *
 * Uses environment variables for the base URL and defines specific API endpoints.
 */

// Base URL for the backend API, defaults to localhost if not set in .env
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Define specific API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE_LOGIN: `${API_BASE_URL}/api/auth/google-login`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/api/auth/google-callback`,
    ME: `${API_BASE_URL}/api/auth/me`,
    VERIFY_CURRENT_USER: `${API_BASE_URL}/api/auth/get-current-user`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },
  JOBS: {
    PUBLIC_JOBS: `${API_BASE_URL}/api/jobs/public`,
    PUBLIC_JOB_DETAIL: (id: string) => `${API_BASE_URL}/api/jobs/public/${id}`,
    MY_JOBS: `${API_BASE_URL}/api/jobs/my-jobs`,
    JOB_DETAIL: (id: string) => `${API_BASE_URL}/api/jobs/${id}`,
    CREATE_JOB: `${API_BASE_URL}/api/jobs`,
    UPDATE_JOB: (id: string) => `${API_BASE_URL}/api/jobs/${id}`,
    UPDATE_JOB_STATUS: (id: string) => `${API_BASE_URL}/api/jobs/${id}/status`,
    JOB_APPLICATIONS: (id: string) => `${API_BASE_URL}/api/jobs/${id}/applications`,
    MY_APPLICATIONS: `${API_BASE_URL}/api/jobs/my-applications`,
    APPLY_FOR_JOB: (id: string) => `${API_BASE_URL}/api/jobs/${id}/apply`,
    ACCEPT_APPLICATION: (id: string) => `${API_BASE_URL}/api/jobs/applications/${id}/accept`,
    REJECT_APPLICATION: (id: string) => `${API_BASE_URL}/api/jobs/applications/${id}/reject`,
    DELETE_APPLICATION: (id: string) => `${API_BASE_URL}/api/jobs/applications/${id}`,
  },
  PLANS: {
    GET_PLANS: `${API_BASE_URL}/api/plan`,
  },
  PAYMENT: {
    INITIATE: `${API_BASE_URL}/api/payment/initiate`,
    CALLBACK: `${API_BASE_URL}/api/payment/callback`,
    FAILURE: `${API_BASE_URL}/api/payment/failure`,
  },
} as const;

