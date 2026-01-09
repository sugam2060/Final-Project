import { memo, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  FiZap,
  FiEdit3,
  FiCpu,
  FiClock,
  FiFilter,
} from "react-icons/fi";
import { toast } from "sonner";
import { useAuth } from "@/Hook/AuthContext";
import { initiatePayment, submitEsewaPayment } from "@/api/payment";
import type { Plan } from "@/api/plan";
import { PREMIUM_FEATURES, DEFAULT_PRICES, PRICING_MESSAGES } from "./constants";

interface PricingCardPremiumProps {
  plan?: Plan;
}

const FEATURE_ICONS = {
  zap: FiZap,
  edit: FiEdit3,
  cpu: FiCpu,
  clock: FiClock,
  filter: FiFilter,
} as const;

/**
 * PremiumPricing Component
 * 
 * Displays the premium pricing plan card with features and payment functionality.
 * 
 * Features:
 * - Premium plan details
 * - Payment initiation
 * - Feature list display
 * - User plan status checking
 */
export const PricingCardPremium = memo(function PricingCardPremium({ plan }: PricingCardPremiumProps) {
  const { user } = useAuth();
  
  // Disable premium card only if user already has premium plan
  const isDisabled = useMemo(() => user?.plan === "premium", [user?.plan]);

  const paymentMutation = useMutation({
    mutationFn: initiatePayment,
    onSuccess: (data) => {
      if (data.url && data.parameters) {
        submitEsewaPayment(data);
        toast.info(PRICING_MESSAGES.REDIRECTING);
      } else {
        toast.error(PRICING_MESSAGES.PAYMENT_DATA_ERROR);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate payment");
    },
  });

  const handlePayment = useCallback(() => {
    if (isDisabled) {
      toast.info(PRICING_MESSAGES.ALREADY_HAVE_PREMIUM);
      return;
    }

    if (!user) {
      toast.error(PRICING_MESSAGES.LOGIN_REQUIRED);
      return;
    }

    if (!plan) {
      toast.error(PRICING_MESSAGES.PLAN_UNAVAILABLE);
      return;
    }

    paymentMutation.mutate({
      plan: plan.plan_name,
    });
  }, [isDisabled, user, plan, paymentMutation]);

  const buttonText = useMemo(() => {
    if (paymentMutation.isPending) {
      return PRICING_MESSAGES.PROCESSING;
    }
    if (isDisabled) {
      return PRICING_MESSAGES.CURRENT_PLAN;
    }
    return PRICING_MESSAGES.SELECT_PREMIUM;
  }, [paymentMutation.isPending, isDisabled]);

  const price = useMemo(() => plan?.price ?? DEFAULT_PRICES.premium, [plan?.price]);
  const validFor = useMemo(() => plan?.valid_for, [plan?.valid_for]);

  return (
    <article 
      className="relative bg-slate-900 rounded-3xl p-8 border-2 border-primary shadow-2xl text-white flex flex-col"
      aria-label="Premium pricing plan"
    >
      {/* Ribbon */}
      <div 
        className="absolute top-0 right-0 bg-primary px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest"
        aria-label="Most popular plan"
      >
        Most Popular
      </div>

      <div className="mb-8">
        <div 
          className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary"
          aria-hidden="true"
        >
          <FiZap size={22} />
        </div>

        <h3 className="text-2xl font-bold mb-2">
          Premium <span className="text-primary">+ AI</span>
        </h3>

        <p className="text-slate-400 text-sm">
          Full automation with optional manual job control.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black" aria-label={`Price: ₹${price}`}>
            ₹{price}
          </span>
          <span className="text-slate-400">
            {validFor ? `/ ${validFor} days` : "/ month"}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Up to 5 automated postings included
        </p>
      </div>

      <Button 
        type="button"
        className="mb-10 py-6 text-base shadow-lg shadow-primary/30"
        onClick={handlePayment}
        disabled={paymentMutation.isPending || isDisabled}
        aria-label={buttonText}
        aria-busy={paymentMutation.isPending}
      >
        {buttonText}
      </Button>

      <div className="space-y-4" role="list" aria-label="Premium plan features">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Everything in Standard plus:
        </p>

        {PREMIUM_FEATURES.map((feature) => {
          const IconComponent = FEATURE_ICONS[feature.icon];
          return (
            <Feature 
              key={feature.text} 
              icon={<IconComponent />} 
              text={feature.text} 
            />
          );
        })}
      </div>
    </article>
  );
});

interface FeatureProps {
  icon: React.ReactNode;
  text: string;
}

const Feature = memo(function Feature({ icon, text }: FeatureProps) {
  return (
    <div className="flex items-start gap-3" role="listitem">
      <span className="text-primary mt-1" aria-hidden="true">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
});
