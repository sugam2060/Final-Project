import { FaBriefcase } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-background-dark border-t py-12">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FaBriefcase className="text-primary text-xl" />
              <h2 className="font-bold text-lg">JobPortal</h2>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Connecting top talent with the world's best companies.
            </p>
          </div>

          {/* Candidates */}
          <div>
            <h3 className="font-bold mb-3">For Candidates</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Browse Jobs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Companies
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Salaries
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 text-sm text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-center sm:text-left">
            © {currentYear} JobPortal Inc.
          </span>

          <span className="flex items-center gap-1">
            <span className="text-xs">🌐</span>
            English (US)
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
