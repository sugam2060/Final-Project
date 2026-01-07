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

const categories = [
  { icon: FaCode, title: "Engineering", count: "850 open positions" },
  { icon: FaPalette, title: "Design", count: "420 open positions" },
  { icon: FaBullhorn, title: "Marketing", count: "310 open positions" },
  { icon: FaChartLine, title: "Sales", count: "500+ open positions" },
  { icon: FaDollarSign, title: "Finance", count: "120 open positions" },
  { icon: FaIdBadge, title: "Human Resources", count: "90 open positions" },
  { icon: FaHospital, title: "Healthcare", count: "600 open positions" },
  { icon: FaGraduationCap, title: "Education", count: "200 open positions" },
];

const PopularJobs = () => {
  return (
    <section className="bg-white dark:bg-background-dark py-10 md:py-12">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">
            Popular Job Categories
          </h2>
          <a
            className="text-primary font-bold text-sm self-start sm:self-auto"
            href="#"
          >
            View all
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon;

            return (
              <div
                key={cat.title}
                className="
                  p-5 sm:p-6
                  rounded-xl
                  border dark:border-gray-700
                  hover:border-primary
                  transition
                  flex items-start gap-4
                  sm:flex-col sm:gap-0
                "
              >
                <div className="flex-shrink-0 sm:mb-3">
                  <IconComponent className="text-primary text-xl sm:text-2xl" />
                </div>

                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-gray-500">{cat.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PopularJobs;
