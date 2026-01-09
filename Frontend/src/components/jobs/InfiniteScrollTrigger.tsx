import { Spinner } from "@/components/ui/spinner";

interface InfiniteScrollTriggerProps {
  observerRef: React.RefObject<HTMLDivElement | null>;
  isFetching: boolean;
  hasNextPage: boolean;
  totalItems: number;
}

export function InfiniteScrollTrigger({
  observerRef,
  isFetching,
  hasNextPage,
  totalItems,
}: InfiniteScrollTriggerProps) {
  return (
    <>
      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-10 flex items-center justify-center mt-8">
        {isFetching && (
          <div className="flex items-center gap-2">
            <Spinner className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">Loading more jobs...</span>
          </div>
        )}
      </div>

      {!hasNextPage && totalItems > 0 && (
        <div className="text-center mt-8 text-sm text-muted-foreground">
          No more jobs to load
        </div>
      )}
    </>
  );
}

