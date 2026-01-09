import { memo } from "react";
import SocialLoginCard from "@/components/auth/SocialLoginCard";
import AuthFooterLinks from "@/components/auth/AuthFooterLink";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/**
 * SocialLoginPage Component
 * 
 * Login page with social authentication options.
 * 
 * Features:
 * - Social login options
 * - Background pattern
 * - Footer links
 */
const SocialLoginPage = memo(function SocialLoginPage() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden font-display bg-background-light dark:bg-background-dark text-[#111418] dark:text-white transition-colors duration-200">
      {/* Top Right Home Button */}
      <div className="absolute top-4 right-4 z-20">
        <Link to={"/"}>
          <Button variant="outline">
            Home
          </Button>
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 relative">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#136dec 0.5px, transparent 0.5px), radial-gradient(#136dec 0.5px, #f6f7f8 0.5px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        />

        <SocialLoginCard />

        <AuthFooterLinks />
      </main>
    </div>
  );
});

SocialLoginPage.displayName = "SocialLoginPage";

export default SocialLoginPage;
