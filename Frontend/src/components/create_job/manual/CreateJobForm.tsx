import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Form } from "@/components/ui/form"
import { jobFormSchema } from "./jobFormSchema"
import type { JobFormValues } from "./jobFormSchema"
import { BasicInfoSection } from "./BasicInfoSection"
import { JobDetailsSection } from "./JobDetailsSection"
import { DescriptionSection } from "./DescriptionSection"
import { FormActions } from "./FormActions"

interface CreateJobFormProps {
  onSubmit: (values: JobFormValues) => void | Promise<void>
  onCancel?: () => void
  defaultValues?: Partial<JobFormValues>
  isSubmitting?: boolean
  customActions?: React.ReactNode
  onFormReady?: (form: UseFormReturn<JobFormValues>) => void
}

export function CreateJobForm({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
  customActions,
  onFormReady,
}: CreateJobFormProps) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      location: "",
      workMode: "onsite",
      employmentType: "full-time",
      experienceLevel: "entry",
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
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (onFormReady) {
      onFormReady(form)
    }
  }, [form, onFormReady])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 bg-background border rounded-xl p-6"
      >
        <BasicInfoSection form={form} />
        <JobDetailsSection form={form} />
        <DescriptionSection form={form} />
        {customActions || <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />}
      </form>
    </Form>
  )
}

// Export form type for external use
export type CreateJobFormInstance = UseFormReturn<JobFormValues>

