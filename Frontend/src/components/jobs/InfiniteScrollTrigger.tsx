import { memo } from "react";
import { Spinner } from "@/components/ui/spinner";

interface InfiniteScrollTriggerProps {
  observerRef: React.RefObject<HTMLDivElement | null>;
  isFetching: boolean;
  hasNextPage: boolean;
  totalItems: number;
}

/**
 * InfiniteScrollTrigger Component
 * 
 * Handles infinite scroll loading indicator and end-of-list message.
 * 
 * Features:
 * - Loading state indicator
 * - End-of-list message
 * - Intersection observer trigger point
 */
export const InfiniteScrollTrigger = memo(function InfiniteScrollTrigger({
  observerRef,
  isFetching,
  hasNextPage,
  totalItems,
}: InfiniteScrollTriggerProps) {
  return (
    <>
      {/* Infinite scroll trigger */}
      <div 
        ref={observerRef} 
        className="h-10 flex items-center justify-center mt-8"
        aria-live="polite"
        aria-atomic="true"
      >
        {isFetching && (
          <div className="flex items-center gap-2" role="status">
            <Spinner className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">Loading more jobs...</span>
          </div>
        )}
      </div>

      {!hasNextPage && totalItems > 0 && (
        <div 
          className="text-center mt-8 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          No more jobs to load
        </div>
      )}
    </>
  );
})

