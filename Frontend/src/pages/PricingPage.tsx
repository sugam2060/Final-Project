import { PricingCardStandard } from "@/components/pricing/StandardPricing";
import { PricingCardPremium } from "@/components/pricing/PremiumPricing";
import { FAQItem } from "@/components/pricing/PricingFAQ";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background-light text-slate-900 font-display py-12">
      <section className="max-w-7xl mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Pricing & Plans
          </span>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Hire faster with <br />
            <span className="text-primary">transparent pricing</span>
          </h1>

          <p className="text-slate-500 text-lg md:text-xl">
            Choose the plan that fits your recruitment needs. No hidden fees, just great talent.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <PricingCardStandard />
          <PricingCardPremium />
        </div>

        {/* FAQ */}
        <div className="mt-24 grid md:grid-cols-2 gap-12 max-w-5xl mx-auto border-t border-slate-200 pt-16">
          <FAQItem
            icon="help"
            title="How does the AI Agent work?"
            description="Our AI Agent drafts a custom job description for approval, posts it instantly, and after one week analyzes all resumes to shortlist the top 50% candidates."
          />

          <FAQItem
            icon="sync"
            title="Can I upgrade my listing?"
            description="Yes. You can upgrade to Premium anytime and the AI will retroactively screen all existing applicants."
          />
        </div>
      </section>
    </main>
  );
}
