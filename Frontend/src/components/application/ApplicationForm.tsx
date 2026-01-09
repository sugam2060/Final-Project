import { memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { applicationFormSchema, type ApplicationFormValues } from "./applicationFormSchema";
import { FiFileText, FiUpload } from "react-icons/fi";

interface ApplicationFormProps {
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * ApplicationForm Component
 * 
 * Form for submitting job applications with resume upload.
 * 
 * Features:
 * - Resume PDF upload (required)
 * - Cover letter (optional)
 * - Portfolio, LinkedIn, GitHub URLs (optional)
 * - Expected salary (optional)
 * - Availability date (optional)
 * - Additional notes (optional)
 * - Form validation with Zod
 */
export const ApplicationForm = memo(function ApplicationForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ApplicationFormProps) {
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      cover_letter: "",
      portfolio_url: "",
      linkedin_url: "",
      github_url: "",
      expected_salary: undefined,
      availability_date: "",
      additional_notes: "",
    },
    mode: "onChange",
  });

  const handleSubmit = useCallback(
    async (values: ApplicationFormValues) => {
      await onSubmit(values);
    },
    [onSubmit]
  );

  const resumeFile = form.watch("resume");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
        aria-label="Job application form"
      >
        {/* Resume Upload - Required */}
        <FormField
          control={form.control}
          name="resume"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>
                Resume (PDF) <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <FiUpload className="text-primary" size={20} />
                      <span className="text-sm font-medium">
                        {resumeFile ? resumeFile.name : "Choose PDF file"}
                      </span>
                    </label>
                    <input
                      {...field}
                      id="resume-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                        }
                      }}
                      aria-label="Upload resume PDF"
                    />
                  </div>
                  {resumeFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FiFileText size={16} aria-hidden="true" />
                      <span>
                        {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cover Letter */}
        <FormField
          control={form.control}
          name="cover_letter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell us why you're interested in this position..."
                  rows={6}
                  className="resize-none"
                  aria-label="Cover letter"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="portfolio_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portfolio URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://yourportfolio.com"
                    aria-label="Portfolio URL"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedin_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    aria-label="LinkedIn profile URL"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="github_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub Profile (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://github.com/yourusername"
                    aria-label="GitHub profile URL"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expected_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Salary (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="50000"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                    aria-label="Expected salary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Availability Date */}
        <FormField
          control={form.control}
          name="availability_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability Date (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  aria-label="Availability date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="additional_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Any additional information you'd like to share..."
                  rows={4}
                  className="resize-none"
                  aria-label="Additional notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t" role="group" aria-label="Form actions">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              aria-label="Cancel application"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-label="Submit application"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
});

