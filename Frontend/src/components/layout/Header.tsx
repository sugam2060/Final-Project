import { useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBriefcase, FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/Hook/AuthContext";
import { API_ENDPOINTS } from "@/config/api";

// Navigation links configuration
interface NavLink {
  to: string;
  label: string;
  requiresRole?: "both";
}

const NAV_LINKS: NavLink[] = [
  { to: "/jobs/browse", label: "Browse Jobs" },
  { to: "/jobs", label: "My Jobs", requiresRole: "both" },
  { to: "/plans", label: "Plans" },
  { to: "/post", label: "Post a Job", requiresRole: "both" },
];

/**
 * Header Component
 * 
 * Main navigation header with responsive mobile menu.
 * 
 * Features:
 * - Responsive design (desktop and mobile)
 * - User authentication state
 * - Role-based navigation
 * - Logout functionality
 */
const Header = memo(function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      // Call backend logout API
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: "POST",
        credentials: "include", // Important: sends cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if API call fails
    } finally {
      // Remove user from localStorage
      localStorage.removeItem("user");
      setUser(null);

      // Navigate to login
      navigate("/login");
    }
  }, [navigate, setUser]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-border px-4 md:px-10 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        {/* Logo */}
        <Link to={"/"}>
          <div className="flex items-center gap-2">
            <FaBriefcase className="text-primary text-3xl" />
            <h2 className="text-lg font-bold">JobPortal</h2>
          </div>
        </Link>

        {/* Desktop Navigation & Auth Section - Right aligned */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              if (link.requiresRole && user?.role !== link.requiresRole) {
                return null;
              }
              return (
                <Link
                  key={link.to}
                  className="text-sm font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                  to={link.to}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Section */}
          <div className="flex items-center">
            {user ? (
              <UserAvatar
                name={user.name}
                email={user.email}
                avatar_url={user.avatar_url}
                showMenu
                onLogout={handleLogout}
              />
            ) : (
              <Link to="/login">
                <Button aria-label="Sign in">Sign In</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden text-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1"
          onClick={toggleMenu}
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          <FaBars aria-hidden="true" />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              aria-hidden="true"
            />

            <motion.div
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-background-dark z-50 shadow-lg px-6 py-5 flex flex-col gap-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Menu</h3>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>

              <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
                {NAV_LINKS.map((link) => {
                  if (link.requiresRole && user?.role !== link.requiresRole) {
                    return null;
                  }
                  return (
                    <Link
                      key={link.to}
                      className="text-sm font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                      to={link.to}
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto">
                {user ? (
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={user.name}
                      email={user.email}
                      avatar_url={user.avatar_url}
                      showMenu
                      onLogout={handleLogout}
                    />
                    <span className="text-sm font-medium">
                      {user.name}
                    </span>
                  </div>
                ) : (
                  <Link to="/login">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
});

Header.displayName = "Header";

export default Header;