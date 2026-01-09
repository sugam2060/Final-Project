import { z } from "zod";

/**
 * Job application form validation schema
 * 
 * Validates all fields for job application submission.
 */
export const applicationFormSchema = z.object({
  resume: z
    .any()
    .refine((file) => file instanceof File, {
      message: "Resume file is required",
    })
    .refine((file) => file instanceof File && file.type === "application/pdf", {
      message: "Only PDF files are allowed",
    })
    .refine((file) => file instanceof File && file.size <= 10 * 1024 * 1024, {
      message: "File size must not exceed 10MB",
    }),
  cover_letter: z
    .string()
    .max(5000, "Cover letter must not exceed 5000 characters")
    .optional(),
  portfolio_url: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  linkedin_url: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  github_url: z
    .string()
    .url("Please enter a valid GitHub URL")
    .optional()
    .or(z.literal("")),
  expected_salary: z
    .preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().min(0, "Expected salary must be 0 or greater").optional()
    )
    .optional(),
  availability_date: z.string().optional(),
  additional_notes: z
    .string()
    .max(2000, "Additional notes must not exceed 2000 characters")
    .optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

