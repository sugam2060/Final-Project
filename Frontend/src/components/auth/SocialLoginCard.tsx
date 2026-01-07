import { FaBriefcase, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const API_BASE_URL = "http://localhost:8000";

const SocialLoginCard = () => {
  
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google-login`;
  };

  return (
    <div className="w-full max-w-[480px] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-10 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="size-14 text-primary bg-primary/10 rounded-2xl flex items-center justify-center">
            <FaBriefcase className="text-2xl" />
          </div>
        </div>

        <h2 className="tracking-tight text-[28px] font-bold">
          Welcome Back
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base pt-2">
          Sign in to access your dashboard.
        </p>
      </div>

      {/* Social Buttons */}
      <div className="px-8 pb-12 flex flex-col gap-4">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="
            flex w-full items-center justify-center gap-3
            rounded-lg h-14 px-5
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            text-base font-bold
            hover:bg-gray-50 dark:hover:bg-gray-700
            transition-colors
          "
        >
          <FcGoogle className="text-2xl" />
          <span>Continue with Google</span>
        </button>

        {/* GitHub (future) */}
        <button
          type="button"
          className="
            flex w-full items-center justify-center gap-3
            rounded-lg h-14 px-5
            bg-[#24292e] text-white
            text-base font-bold
            hover:bg-[#2f363d]
            transition-colors shadow-sm
          "
        >
          <FaGithub className="text-2xl" />
          <span>Continue with GitHub</span>
        </button>
      </div>
    </div>
  );
};

export default SocialLoginCard;
