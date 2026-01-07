import { FiHelpCircle, FiRefreshCcw } from "react-icons/fi";

export function FAQItem({
  icon,
  title,
  description,
}: {
  icon: "help" | "sync";
  title: string;
  description: string;
}) {
  const Icon = icon === "help" ? FiHelpCircle : FiRefreshCcw;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
        <Icon className="text-primary" />
        {title}
      </h4>

      <p className="text-slate-500 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
