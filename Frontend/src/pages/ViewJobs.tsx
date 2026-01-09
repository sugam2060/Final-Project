import { memo, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyJobs } from "@/api/job";
import {
  ViewJobsHeader,
  ViewJobsSkeleton,
  ViewJobsError,
  JobList,
  InfiniteScrollTrigger,
} from "@/components/jobs";
import { PAGE_SIZE, INTERSECTION_THRESHOLD } from "./constants";

/**
 * ViewJobs Page Component
 * 
 * Displays user's job postings with infinite scroll.
 * 
 * Features:
 * - Infinite scroll loading
 * - Job list display
 * - Error handling
 */
function ViewJobs() {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["my-jobs"],
    queryFn: ({ pageParam = 1 }) => getMyJobs(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      return lastPage.has_next ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: INTERSECTION_THRESHOLD }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <ViewJobsSkeleton />;
  }

  if (isError) {
    return <ViewJobsError error={error} />;
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <ViewJobsHeader totalJobs={totalJobs} />
      <JobList jobs={allJobs} />
      <InfiniteScrollTrigger
        observerRef={observerTarget}
        isFetching={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        totalItems={allJobs.length}
      />
    </div>
  );
}

export default memo(ViewJobs);

