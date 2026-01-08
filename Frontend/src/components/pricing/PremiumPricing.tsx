import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
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

interface PricingCardPremiumProps {
  plan?: Plan;
}

export function PricingCardPremium({ plan }: PricingCardPremiumProps) {
  const { user } = useAuth();

  const paymentMutation = useMutation({
    mutationFn: initiatePayment,
    onSuccess: (data) => {
      console.log("Payment initiation successful:", data);
      if (data.payment_url && data.form_data) {
        try {
          // Submit form to eSewa
          submitEsewaPayment(data);
          toast.info("Redirecting to payment gateway...");
        } catch (error) {
          console.error("Error submitting payment form:", error);
          toast.error("Failed to redirect to payment gateway. Please try again.");
        }
      } else {
        console.error("Invalid payment data:", data);
        toast.error("Payment data not received");
      }
    },
    onError: (error: Error) => {
      console.error("Payment initiation error:", error);
      toast.error(error.message || "Failed to initiate payment");
    },
  });

  const handlePayment = () => {
    if (!user) {
      toast.error("Please login to continue");
      return;
    }

    paymentMutation.mutate({
      plan: plan?.plan_name ?? "premium",
      amount: plan?.price ?? 1000.0,
      product_name:
        plan?.description ?? "Premium Plan - Monthly Subscription with AI",
    });
  };

  return (
    <div className="relative bg-slate-900 rounded-3xl p-8 border-2 border-primary shadow-2xl text-white flex flex-col">
      {/* Ribbon */}
      <div className="absolute top-0 right-0 bg-primary px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
        Most Popular
      </div>

      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary">
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
          <span className="text-5xl font-black">
            ₹{plan?.price ?? 1000}
          </span>
          <span className="text-slate-400">
            {plan ? `/ ${plan.valid_for} days` : "/ month"}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Up to 5 automated postings included
        </p>
      </div>

      <Button 
        className="mb-10 py-6 text-base shadow-lg shadow-primary/30"
        onClick={handlePayment}
        disabled={paymentMutation.isPending}
      >
        {paymentMutation.isPending ? "Processing..." : "Select Premium"}
      </Button>

      <div className="space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Everything in Standard plus:
        </p>

        <Feature icon={<FiZap />} text="5 automated job postings per month" />
        <Feature icon={<FiEdit3 />} text="Manual job posting anytime" />
        <Feature icon={<FiCpu />} text="AI-written job descriptions" />
        <Feature icon={<FiClock />} text="7-day automated applicant tracking" />
        <Feature icon={<FiFilter />} text="Top 50% intelligent shortlisting" />
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-primary mt-1">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
