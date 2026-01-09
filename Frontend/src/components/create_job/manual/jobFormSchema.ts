import { z } from "zod"

/**
 * Job form validation schema
 * 
 * Validates all fields for job posting creation/editing.
 * Includes cross-field validation (e.g., salary range).
 */
export const jobFormSchema = z
  .object({
    jobTitle: z
      .string()
      .min(2, "Job title must be at least 2 characters")
      .max(200, "Job title must not exceed 200 characters"),
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must not exceed 100 characters"),
    location: z
      .string()
      .min(2, "Work location must be at least 2 characters")
      .max(200, "Work location must not exceed 200 characters"),
    workMode: z.enum(["remote", "hybrid", "onsite"]).default("onsite"),
    employmentType: z.enum([
      "full-time",
      "part-time",
      "contract",
      "freelance",
      "internship",
    ]),
    experienceLevel: z.enum(["entry", "mid", "senior", "executive"]),
    category: z.string().max(100, "Category must not exceed 100 characters").optional(),
    industry: z.string().max(100, "Industry must not exceed 100 characters").optional(),
    salaryMin: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().min(0, "Minimum salary must be 0 or greater").optional()
    ),
    salaryMax: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().min(0, "Maximum salary must be 0 or greater").optional()
    ),
    salaryCurrency: z.string().default("NPR"),
    salaryPeriod: z.string().max(50, "Salary period must not exceed 50 characters").optional(),
    isSalaryNegotiable: z.boolean().default(false),
    applicationDeadline: z.string().optional(),
    expiresAt: z.string().optional(),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(10000, "Description must not exceed 10,000 characters"),
  })
  .refine(
    (data) => {
      // Validate salary range: min should not exceed max
      if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
        return data.salaryMin <= data.salaryMax
      }
      return true
    },
    {
      message: "Minimum salary cannot exceed maximum salary",
      path: ["salaryMin"],
    }
  )
  .refine(
    (data) => {
      // Validate deadline: application deadline should be before expires at
      if (data.applicationDeadline && data.expiresAt) {
        return new Date(data.applicationDeadline) <= new Date(data.expiresAt)
      }
      return true
    },
    {
      message: "Application deadline cannot be after expiration date",
      path: ["applicationDeadline"],
    }
  )

export type JobFormValues = z.infer<typeof jobFormSchema>

