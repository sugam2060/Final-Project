import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_COUNT } from "./constants";

/**
 * ViewJobsSkeleton Component
 * 
 * Loading skeleton for the jobs listing page.
 * 
 * Features:
 * - Consistent skeleton structure
 * - Accessible loading state
 */
export const ViewJobsSkeleton = memo(function ViewJobsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4" aria-label="Loading jobs" role="status">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
})

