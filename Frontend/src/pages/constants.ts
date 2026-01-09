/**
 * Constants for page components
 */

export const SKELETON_COUNT = 5;

export const EMPLOYMENT_TYPES = [
  { value: "all", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "all", label: "All levels" },
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive" },
] as const;

export const WORK_MODES = [
  { value: "all", label: "All modes" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
] as const;

export const PAGE_SIZE = 10;

export const INTERSECTION_THRESHOLD = 0.1;

