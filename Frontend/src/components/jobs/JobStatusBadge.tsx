import { memo, useMemo } from "react";
import { STATUS_BADGE_STYLES, type JobStatus } from "./constants";

interface JobStatusBadgeProps {
  status: string;
}

/**
 * JobStatusBadge Component
 * 
 * Displays a colored badge indicating the job posting status.
 * 
 * Features:
 * - Color-coded status indicators
 * - Accessible labels
 */
export const JobStatusBadge = memo(function JobStatusBadge({ status }: JobStatusBadgeProps) {
  // Memoize status style and label
  const { style, label } = useMemo(() => {
    const normalizedStatus = status.toLowerCase() as JobStatus;
    const statusStyle = STATUS_BADGE_STYLES[normalizedStatus] || STATUS_BADGE_STYLES.draft;
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    
    return {
      style: statusStyle,
      label: statusLabel,
    };
  }, [status]);

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${style}`}
      role="status"
      aria-label={`Job status: ${label}`}
    >
      {label}
    </span>
  );
})

