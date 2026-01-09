import { memo, useCallback, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getPublicJobs, type PublicJobsFilters } from "@/api/job";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { JobResponse } from "@/api/job";
import { SKELETON_COUNT, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES, PAGE_SIZE } from "./constants";

/**
 * Format date string to readable format
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return "N/A";
  }
}

/**
 * JobCard Component for JobListing page
 */
const JobCard = memo(function JobCard({ job }: { job: JobResponse }) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/jobs/view/${job.id}`);
  }, [navigate, job.id]);

  return (
    <article
      className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card cursor-pointer"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View job: ${job.title} at ${job.company_name}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold">{job.title}</h2>
            {job.is_featured && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Featured
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-2 font-semibold">
            {job.company_name}
          </p>
          <p className="text-muted-foreground mb-2">
            📍 {job.location} • {job.work_mode}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
              {job.employment_type}
            </span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
              {job.experience_level}
            </span>
            {job.category && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                {job.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {job.salary_min && job.salary_max && (
        <div className="mb-4 text-sm">
          <span className="text-muted-foreground">Salary: </span>
          <span className="font-semibold">
            {job.salary_currency} {job.salary_min.toLocaleString()} -{" "}
            {job.salary_max.toLocaleString()}
            {job.salary_period && ` ${job.salary_period}`}
            {job.is_salary_negotiable && " (Negotiable)"}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          <span>Posted: {formatDate(job.published_at)}</span>
          {job.application_deadline && (
            <span className="ml-4">
              Deadline: {formatDate(job.application_deadline)}
            </span>
          )}
        </div>
        <div>
          <span>{job.view_count} views</span>
        </div>
      </div>
    </article>
  );
});

const JobListingSkeleton = memo(function JobListingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading jobs">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div key={i} className="border rounded-lg p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
});

/**
 * JobListing Page Component
 * 
 * Displays a list of public job postings with filtering capabilities.
 * 
 * Features:
 * - Infinite scroll
 * - Advanced filtering
 * - Search functionality
 * - Responsive design
 */
function JobListing() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PublicJobsFilters>({
    category: "",
    employment_type: "",
    experience_level: "",
    work_mode: "",
    location: "",
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["public-jobs", filters],
    queryFn: ({ pageParam = 1 }) => getPublicJobs(pageParam, PAGE_SIZE, filters),
    getNextPageParam: (lastPage) => {
      return lastPage.has_next ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const handleFilterChange = useCallback((key: keyof PublicJobsFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: "",
      employment_type: "",
      experience_level: "",
      work_mode: "",
      location: "",
    });
  }, []);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  // Memoize computed values BEFORE any conditional returns
  // This ensures hooks are always called in the same order
  const allJobs = useMemo(
    () => data?.pages.flatMap((page) => page.jobs) ?? [],
    [data?.pages]
  );
  const totalJobs = useMemo(
    () => data?.pages[0]?.total ?? 0,
    [data?.pages]
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <Skeleton className="h-10 w-64 mb-8" />
        <JobListingSkeleton />
      </div>
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 text-center" role="alert" aria-live="assertive">
        <h1 className="text-3xl font-black mb-4">Error Loading Jobs</h1>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <Button onClick={handleRefetch} aria-label="Retry loading jobs">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Browse Jobs</h1>
        <p className="text-muted-foreground">
          Discover opportunities that match your skills and interests
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Input
              placeholder="Search location..."
              value={filters.location || ""}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Employment Type</label>
            <Select
              value={filters.employment_type || "all"}
              onValueChange={(value) => handleFilterChange("employment_type", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Experience Level</label>
            <Select
              value={filters.experience_level || "all"}
              onValueChange={(value) => handleFilterChange("experience_level", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Work Mode</label>
            <Select
              value={filters.work_mode || "all"}
              onValueChange={(value) => handleFilterChange("work_mode", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All modes" />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Input
              placeholder="Search category..."
              value={filters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-muted-foreground">
          Found <span className="font-semibold">{totalJobs}</span> job
          {totalJobs !== 1 ? "s" : ""}
        </p>
      </div>

      {allJobs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No jobs found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or check back later for new opportunities.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {allJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="text-center">
              <Button
                type="button"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                variant="outline"
                aria-label="Load more jobs"
                aria-busy={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  "Load More Jobs"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(JobListing);

