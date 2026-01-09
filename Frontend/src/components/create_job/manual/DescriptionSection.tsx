import { useState, useEffect } from "react"
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

export function DescriptionSection({ form }: DescriptionSectionProps) {
  const [markdown, setMarkdown] = useState<string>("")
  const descriptionValue = form.watch("description")

  // Sync markdown with form value
  useEffect(() => {
    if (descriptionValue !== markdown) {
      setMarkdown(descriptionValue || "")
    }
  }, [descriptionValue])

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
                  onChange={(value) => {
                    const newValue = value || ""
                    setMarkdown(newValue)
                    field.onChange(newValue)
                  }}
                  onBlur={field.onBlur}
                  preview="live"
                  hideToolbar={false}
                  visibleDragbar={true}
                  height={400}
                  textareaProps={{
                    placeholder: "Describe responsibilities, requirements, and benefits...",
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
}
