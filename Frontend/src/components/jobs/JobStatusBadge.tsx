interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const statusStyles = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        statusStyles[status as keyof typeof statusStyles] || statusStyles.draft
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

