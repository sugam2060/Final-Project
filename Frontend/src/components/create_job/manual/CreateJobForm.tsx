import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, memo, useRef } from "react"
import { Form } from "@/components/ui/form"
import { jobFormSchema } from "./jobFormSchema"
import type { JobFormValues } from "./jobFormSchema"
import { BasicInfoSection } from "./BasicInfoSection"
import { JobDetailsSection } from "./JobDetailsSection"
import { DescriptionSection } from "./DescriptionSection"
import { FormActions } from "./FormActions"
import { DEFAULT_FORM_VALUES } from "./constants"

interface CreateJobFormProps {
  onSubmit: (values: JobFormValues) => void | Promise<void>
  onCancel?: () => void
  defaultValues?: Partial<JobFormValues>
  isSubmitting?: boolean
  customActions?: React.ReactNode
  onFormReady?: (form: UseFormReturn<JobFormValues>) => void
}

/**
 * CreateJobForm Component
 * 
 * A comprehensive form for creating and editing job postings.
 * 
 * Features:
 * - Multi-section form (Basic Info, Job Details, Description)
 * - Form validation with Zod
 * - Customizable actions (default or custom)
 * - Form instance callback for external control
 */
export const CreateJobForm = memo(function CreateJobForm({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
  customActions,
  onFormReady,
}: CreateJobFormProps) {
  // Memoize default values to prevent unnecessary re-initialization
  const formDefaultValues = useMemo(
    () => ({
      ...DEFAULT_FORM_VALUES,
      ...defaultValues,
    }),
    [defaultValues]
  )

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: formDefaultValues,
  })

  // Store callback in ref to avoid dependency issues
  const onFormReadyRef = useRef(onFormReady)
  useEffect(() => {
    onFormReadyRef.current = onFormReady
  }, [onFormReady])

  // Call onFormReady callback when form is ready (only once on mount)
  useEffect(() => {
    onFormReadyRef.current?.(form)
  }, [form])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 bg-background border rounded-xl p-6"
        noValidate
        aria-label="Job posting form"
      >
        <BasicInfoSection form={form} />
        <JobDetailsSection form={form} />
        <DescriptionSection form={form} />
        {customActions || <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />}
      </form>
    </Form>
  )
})

// Export form type for external use
export type CreateJobFormInstance = UseFormReturn<JobFormValues>

