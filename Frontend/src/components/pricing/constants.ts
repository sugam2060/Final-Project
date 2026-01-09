/**
 * Constants for pricing components
 */

export const PREMIUM_FEATURES = [
  { icon: "zap", text: "5 automated job postings per month" },
  { icon: "edit", text: "Manual job posting anytime" },
  { icon: "cpu", text: "AI-written job descriptions" },
  { icon: "clock", text: "7-day automated applicant tracking" },
  { icon: "filter", text: "Top 50% intelligent shortlisting" },
] as const;

export const STANDARD_FEATURES = [
  "Unlimited manual job postings",
  "Active for 30 listing days",
  "Basic applicant tracking",
] as const;

export const DEFAULT_PRICES = {
  standard: 500,
  premium: 1000,
} as const;

export const PRICING_MESSAGES = {
  PROCESSING: "Processing...",
  CURRENT_PLAN: "Current Plan",
  ALREADY_PREMIUM: "Already Premium",
  GET_STARTED: "Get Started",
  SELECT_PREMIUM: "Select Premium",
  REDIRECTING: "Redirecting to payment gateway...",
  PAYMENT_DATA_ERROR: "Payment data not received",
  LOGIN_REQUIRED: "Please login to continue",
  PLAN_UNAVAILABLE: "Plan information not available",
  ALREADY_HAVE_PREMIUM: "You already have Premium plan",
  ALREADY_HAVE_PLAN: "You already have an active plan",
} as const;

