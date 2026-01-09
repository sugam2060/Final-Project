import { memo, useMemo } from "react";
import {
  MdEditDocument,
  MdAutoAwesome,
  MdCheck,
  MdCheckCircle,
  MdSmartToy,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { useAuth } from "@/Hook/AuthContext";

/* ------------------------------------------------------------------ */
/* Option Card Component                                               */
/* ------------------------------------------------------------------ */

interface OptionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  navigateto: string;
  features: React.ReactNode[];
  buttonText: string;
  highlighted?: boolean;
}

const OptionCard = memo(function OptionCard({
    title,
    description,
    icon,
    features,
    buttonText,
    navigateto,
    highlighted = false,
  }: OptionCardProps) {
    return (
      <div
        className={`relative flex flex-col h-full rounded-2xl p-8 transition-all ${
          highlighted
            ? "bg-white dark:bg-gray-800 border-2 border-primary shadow-xl md:-translate-y-2"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
        }`}
      >
        {highlighted && (
          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Fast & Easy
          </div>
        )}
  
        <div className="mb-6 flex flex-col gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              highlighted
                ? "bg-blue-50 dark:bg-blue-900/30 text-primary"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {icon}
          </div>
  
          <div>
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {description}
            </p>
          </div>
        </div>
  
        <div className="grow space-y-4 mb-8">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {feature}
            </div>
          ))}
        </div>
  
        <Link to={navigateto}
          className={`mt-auto w-full py-3 px-6 rounded-xl font-bold transition-colors ${
            highlighted
              ? "bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
              : "bg-[#f0f2f4] hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          }`}
        >
          {buttonText}
        </Link>
      </div>
    );
  }
);

OptionCard.displayName = "OptionCard";

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

/**
 * PostJobMain Page Component
 * 
 * Main page for job posting with options for manual and AI-powered posting.
 * 
 * Features:
 * - Plan-based feature visibility
 * - Option cards for posting methods
 * - FAQ section
 */
function PostJobMain() {
  const { user } = useAuth();
  
  // Show AI option only if user has premium plan (not standard)
  const showAIOption = useMemo(() => user?.plan === "premium", [user?.plan]);
  
  // Allow manual posting for users with standard or premium plan
  const canPostManually = useMemo(
    () => user?.plan === "standard" || user?.plan === "premium",
    [user?.plan]
  );

    return (
      <main className="grow bg-[#f6f7f8] dark:bg-background-dark">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-12 md:py-16">
          {/* Heading */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Create a new job post
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl">
              Choose how you would like to start. You can save your draft at any
              time.
            </p>
          </div>

          {/* Options */}
          <div className={`grid gap-8 max-w-4xl mx-auto ${
            showAIOption ? "md:grid-cols-2" : "md:grid-cols-1"
          }`}>
            {canPostManually && (
              <OptionCard
                title="Post Manually"
                description="Fill out the details yourself for complete control."
                icon={<MdEditDocument size={32} />}
                buttonText="Start Manually"
                navigateto="/post/manual-post"
                features={[
                  <>
                    <MdCheck className="text-gray-400 mt-0.5" />
                    <span className="text-sm">
                      Full control over formatting & structure
                    </span>
                  </>,
                  <>
                    <MdCheck className="text-gray-400 mt-0.5" />
                    <span className="text-sm">Start with a blank canvas</span>
                  </>,
                  <>
                    <MdCheck className="text-gray-400 mt-0.5" />
                    <span className="text-sm">Good for custom roles</span>
                  </>,
                ]}
              />
            )}

            {showAIOption && (
              <OptionCard
                title="Post with AI"
                description="Let our AI write the job description for you."
                icon={<MdAutoAwesome size={32} />}
                buttonText="Start with AI"
                navigateto="/post/automate-post"
                highlighted
                features={[
                  <>
                    <MdCheckCircle className="text-primary mt-0.5" />
                    <span className="text-sm font-bold">
                      Generates content in seconds
                    </span>
                  </>,
                  <>
                    <MdSmartToy className="text-primary mt-0.5" />
                    <span className="text-sm">
                      <strong>Optimized</strong> for search & candidates
                    </span>
                  </>,
                  <>
                    <MdCheckCircle className="text-primary mt-0.5" />
                    <span className="text-sm">
                      Suggests relevant skills automatically
                    </span>
                  </>,
                  <>
                    <MdCheckCircle className="text-primary mt-0.5" />
                    <span className="text-sm">
                      Review and edit before publishing
                    </span>
                  </>,
                ]}
              />
            )}
          </div>
  
          {/* FAQ */}
          <div className="mt-20 grid md:grid-cols-2 gap-12 max-w-4xl mx-auto border-t border-gray-200 dark:border-gray-700 pt-12">
            <div>
              <h4 className="font-bold text-lg mb-2">
                How accurate is the AI content?
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Our AI is trained on millions of successful job posts. It creates
                high-quality drafts, but we recommend reviewing before publishing.
              </p>
            </div>
  
            <div>
              <h4 className="font-bold text-lg mb-2">
                Can I edit the AI-generated post?
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Yes. The AI generates a fully editable draft that you can customize
                as needed.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
}

export default memo(PostJobMain);
  