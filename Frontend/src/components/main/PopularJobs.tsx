import { memo } from "react";
import { Link } from "react-router-dom";
import {
  FaCode,
  FaPalette,
  FaBullhorn,
  FaChartLine,
  FaDollarSign,
  FaIdBadge,
  FaHospital,
  FaGraduationCap,
} from "react-icons/fa";
import type { IconType } from "react-icons";

interface JobCategory {
  icon: IconType;
  title: string;
  count: string;
  slug: string;
}

const CATEGORIES: JobCategory[] = [
  { icon: FaCode, title: "Engineering", count: "850 open positions", slug: "engineering" },
  { icon: FaPalette, title: "Design", count: "420 open positions", slug: "design" },
  { icon: FaBullhorn, title: "Marketing", count: "310 open positions", slug: "marketing" },
  { icon: FaChartLine, title: "Sales", count: "500+ open positions", slug: "sales" },
  { icon: FaDollarSign, title: "Finance", count: "120 open positions", slug: "finance" },
  { icon: FaIdBadge, title: "Human Resources", count: "90 open positions", slug: "human-resources" },
  { icon: FaHospital, title: "Healthcare", count: "600 open positions", slug: "healthcare" },
  { icon: FaGraduationCap, title: "Education", count: "200 open positions", slug: "education" },
];

/**
 * PopularJobs Component
 * 
 * Displays popular job categories in a grid layout.
 * 
 * Features:
 * - Category cards with icons
 * - Responsive grid
 * - Navigation to category pages
 */
const PopularJobs = memo(function PopularJobs() {
  return (
    <section className="bg-white dark:bg-background-dark py-10 md:py-12" aria-label="Popular job categories">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">
            Popular Job Categories
          </h2>
          <Link
            to="/jobs/browse"
            className="text-primary font-bold text-sm self-start sm:self-auto hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
            aria-label="View all job categories"
          >
            View all
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="list">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;

            return (
              <Link
                key={cat.title}
                to={`/jobs/browse?category=${cat.slug}`}
                className="
                  p-5 sm:p-6
                  rounded-xl
                  border dark:border-gray-700
                  hover:border-primary
                  transition
                  flex items-start gap-4
                  sm:flex-col sm:gap-0
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                "
                role="listitem"
                aria-label={`Browse ${cat.title} jobs`}
              >
                <div className="shrink-0 sm:mb-3" aria-hidden="true">
                  <IconComponent className="text-primary text-xl sm:text-2xl" />
                </div>

                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-gray-500">{cat.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
});

PopularJobs.displayName = "PopularJobs";

export default PopularJobs;
