"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

/* ------------------------------------------------------------------ */
/* Zod Schema                                                          */
/* ------------------------------------------------------------------ */

const jobFormSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  companyName: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Work location is required"),
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
  deadline: z.string().optional(),
  description: z.string().min(20, "Description must be at least 20 characters"),
})

type JobFormValues = z.infer<typeof jobFormSchema>

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CreateJobForm() {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      location: "",
      employmentType: "full-time",
      experienceLevel: "entry",
      deadline: "",
      description: "",
    },
  })

  function onSubmit(values: JobFormValues) {
    console.log("Job submitted:", values)
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black">Create Job Posting</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details below to post a new vacancy.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 bg-background border rounded-xl p-6"
        >
          {/* ---------------- Basic Info ---------------- */}

          <section className="space-y-6">
            <h2 className="text-lg font-bold">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Product Designer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Location</FormLabel>
                  <FormControl>
                    <Input placeholder="New York, NY (Remote)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ---------------- Job Details ---------------- */}

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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* ---------------- Description ---------------- */}

          <section className="space-y-6">
            <h2 className="text-lg font-bold">Description & Requirements</h2>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe responsibilities, requirements, and benefits..."
                      className="min-h-[180px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ---------------- Actions ---------------- */}

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Submit Job</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
