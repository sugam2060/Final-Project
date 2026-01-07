import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import {
  FiZap,
  FiEdit3,
  FiCpu,
  FiClock,
  FiFilter,
} from "react-icons/fi";

export function PricingCardPremium() {
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
          <span className="text-5xl font-black">₹1000</span>
          <span className="text-slate-400">/ month</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Up to 5 automated postings included
        </p>
      </div>

      <Button className="mb-10 py-6 text-base shadow-lg shadow-primary/30">
        Select Premium
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
