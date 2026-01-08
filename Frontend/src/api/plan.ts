const API_BASE_URL = "http://localhost:8000";

export interface Plan {
  plan_name: "standard" | "premium";
  price: number;
  currency: string;
  valid_for: number;
  description?: string | null;
}

export interface PlansListResponse {
  plans: Plan[];
}

export const fetchPlans = async (): Promise<PlansListResponse> => {
  const res = await fetch(`${API_BASE_URL}/api/plan/`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to load plans");
  }

  return res.json();
};


