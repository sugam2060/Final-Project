import { memo, useState } from "react";
import { FaBriefcase, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { API_ENDPOINTS } from "@/config/api";

// Style constants for better maintainability
const CARD_STYLES = "w-full max-w-[480px] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-10 overflow-hidden flex flex-col";

const BUTTON_BASE_STYLES = "flex w-full items-center justify-center gap-3 rounded-lg h-14 px-5 text-base font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const GOOGLE_BUTTON_STYLES = `${BUTTON_BASE_STYLES} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`;

const GITHUB_BUTTON_STYLES = `${BUTTON_BASE_STYLES} bg-[#24292e] text-white hover:bg-[#2f363d] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#24292e] focus:ring-offset-2`;

/**
 * SocialLoginCard Component
 * 
 * Provides social authentication options (Google, GitHub) for user login.
 * 
 * Features:
 * - Google OAuth integration
 * - Loading states
 * - Accessibility support
 * - Responsive design
 */
const SocialLoginCard = memo(() => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Redirect to Google OAuth endpoint
    window.location.href = API_ENDPOINTS.AUTH.GOOGLE_LOGIN;
  };

  const handleGitHubLogin = () => {
    // Placeholder for future GitHub OAuth implementation
    console.warn("GitHub login is not yet implemented");
  };

  return (
    <div className={CARD_STYLES} role="main" aria-label="Login options">
      {/* Header */}
      <header className="pt-12 pb-6 px-8 text-center">
        <div className="flex justify-center mb-6" aria-hidden="true">
          <div className="size-14 text-primary bg-primary/10 rounded-2xl flex items-center justify-center">
            <FaBriefcase className="text-2xl" aria-hidden="true" />
          </div>
        </div>

        <h1 className="tracking-tight text-[28px] font-bold">
          Welcome Back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base pt-2">
          Sign in to access your dashboard.
        </p>
      </header>

      {/* Social Buttons */}
      <div className="px-8 pb-12 flex flex-col gap-4">
        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={GOOGLE_BUTTON_STYLES}
          aria-label="Continue with Google"
          aria-busy={isLoading}
        >
          <FcGoogle className="text-2xl" aria-hidden="true" />
          <span>{isLoading ? "Redirecting..." : "Continue with Google"}</span>
        </button>

        {/* GitHub Login Button (Coming Soon) */}
        <button
          type="button"
          onClick={handleGitHubLogin}
          disabled={true}
          className={GITHUB_BUTTON_STYLES}
          aria-label="Continue with GitHub (Coming soon)"
          title="GitHub login coming soon"
        >
          <FaGithub className="text-2xl" aria-hidden="true" />
          <span>Continue with GitHub</span>
          <span className="text-xs opacity-75 ml-auto">(Soon)</span>
        </button>
      </div>
    </div>
  );
});

SocialLoginCard.displayName = "SocialLoginCard";

export default SocialLoginCard;
