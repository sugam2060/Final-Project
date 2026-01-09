import { memo, useMemo } from "react";
import { FiHelpCircle, FiRefreshCcw } from "react-icons/fi";

interface FAQItemProps {
  icon: "help" | "sync";
  title: string;
  description: string;
}

const FAQ_ICONS = {
  help: FiHelpCircle,
  sync: FiRefreshCcw,
} as const;

/**
 * FAQItem Component
 * 
 * Displays a single FAQ item with icon, title, and description.
 * 
 * Features:
 * - Icon-based visual indicator
 * - Accessible structure
 * - Responsive design
 */
export const FAQItem = memo(function FAQItem({
  icon,
  title,
  description,
}: FAQItemProps) {
  const IconComponent = useMemo(() => FAQ_ICONS[icon], [icon]);

  return (
    <article 
      className="bg-white p-6 rounded-2xl border border-slate-100"
      aria-labelledby={`faq-title-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <h4 
        id={`faq-title-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className="font-bold text-lg mb-3 flex items-center gap-2"
      >
        <IconComponent className="text-primary shrink-0" aria-hidden="true" />
        {title}
      </h4>

      <p className="text-slate-500 text-sm leading-relaxed">
        {description}
      </p>
    </article>
  );
});
