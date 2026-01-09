import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyJobs } from "@/api/job";
import {
  ViewJobsHeader,
  ViewJobsSkeleton,
  ViewJobsError,
  JobList,
  InfiniteScrollTrigger,
} from "@/components/jobs";

export default function ViewJobs() {
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
    queryFn: ({ pageParam = 1 }) => getMyJobs(pageParam, 10),
    getNextPageParam: (lastPage) => {
      return lastPage.has_next ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
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

  const allJobs = data?.pages.flatMap((page) => page.jobs) ?? [];
  const totalJobs = data?.pages[0]?.total ?? 0;

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

