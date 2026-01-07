import { Button } from "@/components/ui/button";
import { FiFileText, FiCheckCircle } from "react-icons/fi";

export function PricingCardStandard() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col hover:shadow-2xl transition">
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 text-slate-600">
          <FiFileText size={22} />
        </div>

        <h3 className="text-2xl font-bold mb-2">Standard</h3>
        <p className="text-slate-500 text-sm">
          Perfect for manual hiring and high-volume postings.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black">₹500</span>
          <span className="text-slate-400">/ month</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Access to all manual posting tools
        </p>
      </div>

      <Button variant="secondary" className="mb-10 py-6 text-base">
        Get Started
      </Button>

      <div className="space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Included Features
        </p>

        {[
          "Unlimited manual job postings",
          "Active for 30 listing days",
          "Basic applicant tracking",
        ].map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <FiCheckCircle className="text-emerald-500 mt-1" />
            <span className="text-slate-600 text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
