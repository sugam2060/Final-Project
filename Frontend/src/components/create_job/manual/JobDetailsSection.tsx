import { memo, useCallback } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { JobFormValues } from "./jobFormSchema"
import { EMPLOYMENT_TYPE_OPTIONS, EXPERIENCE_LEVEL_OPTIONS } from "./constants"

interface JobDetailsSectionProps {
  form: UseFormReturn<JobFormValues>
}

/**
 * JobDetailsSection Component
 * 
 * Form section for job details (employment type, experience level, compensation, deadlines).
 */
export const JobDetailsSection = memo(function JobDetailsSection({ form }: JobDetailsSectionProps) {
  // Memoize number input handler to prevent unnecessary re-renders
  const handleNumberChange = useCallback((value: string, onChange: (val: string | undefined) => void) => {
    onChange(value === "" ? undefined : value)
  }, [])
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold">Job Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experienceLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Level</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="applicationDeadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Deadline (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Compensation (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="salaryMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
                    min="0"
                    step="1"
                    value={field.value ?? ""}
                    onChange={(e) => handleNumberChange(e.target.value, field.onChange)}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="80000"
                    min="0"
                    step="1"
                    value={field.value ?? ""}
                    onChange={(e) => handleNumberChange(e.target.value, field.onChange)}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="salaryCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input placeholder="NPR" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Period</FormLabel>
                <FormControl>
                  <Input placeholder="per month" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expires At (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isSalaryNegotiable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Salary is negotiable</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
    </section>
  )
})

