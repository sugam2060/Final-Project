/**
 * Constants for job form components
 */

export const DEFAULT_FORM_VALUES = {
  jobTitle: "",
  companyName: "",
  location: "",
  workMode: "onsite" as const,
  employmentType: "full-time" as const,
  experienceLevel: "entry" as const,
  category: "",
  industry: "",
  salaryMin: undefined,
  salaryMax: undefined,
  salaryCurrency: "NPR",
  salaryPeriod: "",
  isSalaryNegotiable: false,
  applicationDeadline: "",
  expiresAt: "",
  description: "",
} as const;

export const WORK_MODE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
] as const;

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive" },
] as const;

