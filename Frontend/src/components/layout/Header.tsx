import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBriefcase, FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/Hook/AuthContext";


const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { user, setUser } = useAuth();


  const handleLogout = async () => {
    try {
      // Call backend logout API
      await axios.post(
        "http://localhost:8000/api/auth/logout",
        {},
        {
          withCredentials: true, // Important: sends cookies
        }
      );
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
  };

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

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8">
            <a className="text-sm font-medium hover:text-primary" href="#">
              Jobs
            </a>
            <Link className="text-sm font-medium hover:text-primary" to={"/plans"}>
              Plans
            </Link>
            {user?.role === "both" && (
              <Link className="text-sm font-medium hover:text-primary" to={"/post"}>
                Post a Job
              </Link>
            )}
          </nav>

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
              <Button>Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden text-xl"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <FaBars />
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
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-background-dark z-50 shadow-lg px-6 py-5 flex flex-col gap-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Menu</h3>
                <button onClick={() => setIsOpen(false)}>
                  <FaTimes />
                </button>
              </div>

              <nav className="flex flex-col gap-4">
                <a className="text-sm font-medium hover:text-primary" href="#">
                  Jobs
                </a>
                <Link className="text-sm font-medium hover:text-primary" to={"/plans"}>
                  Plans
                </Link>
                {user?.role === "both" && (
                  <Link className="text-sm font-medium hover:text-primary" to={"/post"}>
                    Post a Job
                  </Link>
                )}
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
};

export default Header;