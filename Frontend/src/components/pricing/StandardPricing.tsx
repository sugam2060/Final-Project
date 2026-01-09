import { memo, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FiFileText, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import { useAuth } from "@/Hook/AuthContext";
import { initiatePayment, submitEsewaPayment } from "@/api/payment";
import type { Plan } from "@/api/plan";
import { STANDARD_FEATURES, DEFAULT_PRICES, PRICING_MESSAGES } from "./constants";

interface PricingCardStandardProps {
  plan?: Plan;
}

/**
 * StandardPricing Component
 * 
 * Displays the standard pricing plan card with features and payment functionality.
 * 
 * Features:
 * - Standard plan details
 * - Payment initiation
 * - Feature list display
 * - User plan status checking
 */
export const PricingCardStandard = memo(function PricingCardStandard({ plan }: PricingCardStandardProps) {
  const { user } = useAuth();
  
  // Disable standard card if user already has standard or premium plan
  const isDisabled = useMemo(
    () => user?.plan === "standard" || user?.plan === "premium",
    [user?.plan]
  );

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
      toast.info(PRICING_MESSAGES.ALREADY_HAVE_PLAN);
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
      return user?.plan === "standard" 
        ? PRICING_MESSAGES.CURRENT_PLAN 
        : PRICING_MESSAGES.ALREADY_PREMIUM;
    }
    return PRICING_MESSAGES.GET_STARTED;
  }, [paymentMutation.isPending, isDisabled, user?.plan]);

  const price = useMemo(() => plan?.price ?? DEFAULT_PRICES.standard, [plan?.price]);
  const validFor = useMemo(() => plan?.valid_for, [plan?.valid_for]);
  const description = useMemo(
    () => plan?.description ?? "Perfect for manual hiring and high-volume postings.",
    [plan?.description]
  );

  return (
    <article 
      className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col hover:shadow-2xl transition"
      aria-label="Standard pricing plan"
    >
      <div className="mb-8">
        <div 
          className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 text-slate-600"
          aria-hidden="true"
        >
          <FiFileText size={22} />
        </div>

        <h3 className="text-2xl font-bold mb-2">Standard</h3>
        <p className="text-slate-500 text-sm">
          {description}
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
          Access to all manual posting tools
        </p>
      </div>

      <Button 
        type="button"
        variant="secondary" 
        className="mb-10 py-6 text-base"
        onClick={handlePayment}
        disabled={paymentMutation.isPending || isDisabled}
        aria-label={buttonText}
        aria-busy={paymentMutation.isPending}
      >
        {buttonText}
      </Button>

      <div className="space-y-4" role="list" aria-label="Standard plan features">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Included Features
        </p>

        {STANDARD_FEATURES.map((feature) => (
          <div key={feature} className="flex items-start gap-3" role="listitem">
            <FiCheckCircle className="text-emerald-500 mt-1 shrink-0" aria-hidden="true" />
            <span className="text-slate-600 text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </article>
  );
});
