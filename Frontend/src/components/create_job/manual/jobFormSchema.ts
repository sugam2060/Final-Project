import { z } from "zod"

export const jobFormSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  companyName: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Work location is required"),
  workMode: z.enum(["remote", "hybrid", "onsite"]).default("onsite"),
  employmentType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "freelance",
    "internship",
  ]),
  experienceLevel: z.enum([
    "entry",
    "mid",
    "senior",
    "executive",
  ]),
  category: z.string().optional(),
  industry: z.string().optional(),
  salaryMin: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  salaryMax: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  salaryCurrency: z.string().default("NPR"),
  salaryPeriod: z.string().optional(),
  isSalaryNegotiable: z.boolean().default(false),
  applicationDeadline: z.string().optional(),
  expiresAt: z.string().optional(),
  description: z.string().min(20, "Description must be at least 20 characters"),
})

export type JobFormValues = z.infer<typeof jobFormSchema>

