import { useState, useEffect, memo, useCallback } from "react"
import type { UseFormReturn } from "react-hook-form"
import MDEditor from "@uiw/react-md-editor"
import "@uiw/react-md-editor/markdown-editor.css"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { JobFormValues } from "./jobFormSchema"

interface DescriptionSectionProps {
  form: UseFormReturn<JobFormValues>
}

/**
 * DescriptionSection Component
 * 
 * Form section for job description with markdown editor support.
 * 
 * Features:
 * - Live preview markdown editor
 * - Syncs with form state
 * - Minimum character validation
 */
export const DescriptionSection = memo(function DescriptionSection({ form }: DescriptionSectionProps) {
  const descriptionValue = form.watch("description")
  const [markdown, setMarkdown] = useState<string>(descriptionValue || "")

  // Sync markdown with form value when form value changes externally
  useEffect(() => {
    setMarkdown(descriptionValue || "")
  }, [descriptionValue])

  // Memoize onChange handler to prevent unnecessary re-renders
  const handleMarkdownChange = useCallback(
    (value: string | undefined, onChange: (value: string) => void) => {
      const newValue = value || ""
      setMarkdown(newValue)
      onChange(newValue)
    },
    []
  )

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold">Description & Requirements</h2>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Job Description</FormLabel>
            <FormControl>
              <div className="min-h-[300px]" data-color-mode="light">
                <MDEditor
                  value={markdown}
                  onChange={(value) => handleMarkdownChange(value, field.onChange)}
                  onBlur={field.onBlur}
                  preview="live"
                  hideToolbar={false}
                  visibleDragbar={true}
                  height={400}
                  textareaProps={{
                    placeholder: "Describe responsibilities, requirements, and benefits...",
                    "aria-label": "Job description editor",
                    style: {
                      fontSize: 14,
                    },
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  )
})
