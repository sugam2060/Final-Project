import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaBriefcase } from "react-icons/fa";

interface FooterLink {
  label: string;
  to: string;
}

const CANDIDATE_LINKS: FooterLink[] = [
  { label: "Browse Jobs", to: "/jobs/browse" },
  { label: "Companies", to: "/companies" },
  { label: "Salaries", to: "/salaries" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "Help Center", to: "/help" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Contact", to: "/contact" },
];

/**
 * Footer Component
 * 
 * Site footer with navigation links and company information.
 * 
 * Features:
 * - Responsive grid layout
 * - Navigation links
 * - Copyright information
 */
const Footer = memo(function Footer() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="bg-white dark:bg-background-dark border-t py-12" role="contentinfo">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FaBriefcase className="text-primary text-xl" aria-hidden="true" />
              <h2 className="font-bold text-lg">JobPortal</h2>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Connecting top talent with the world's best companies.
            </p>
          </div>

          {/* Candidates */}
          <nav aria-label="For candidates">
            <h3 className="font-bold mb-3">For Candidates</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {CANDIDATE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support">
            <h3 className="font-bold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 text-sm text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-center sm:text-left">
            © {currentYear} JobPortal Inc.
          </span>

          <span className="flex items-center gap-1" aria-label="Language: English (US)">
            <span className="text-xs" aria-hidden="true">🌐</span>
            English (US)
          </span>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
