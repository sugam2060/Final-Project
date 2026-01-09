import { memo } from "react";

// Style constants
const FOOTER_STYLES = "absolute bottom-6 hidden md:flex gap-6 text-sm text-gray-400 dark:text-gray-500";
const LINK_STYLES = "hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1";

interface FooterLink {
  label: string;
  href: string;
  ariaLabel: string;
}

const FOOTER_LINKS: FooterLink[] = [
  { label: "Privacy", href: "/privacy", ariaLabel: "Privacy Policy" },
  { label: "Terms", href: "/terms", ariaLabel: "Terms of Service" },
  { label: "Help", href: "/help", ariaLabel: "Help and Support" },
];

/**
 * AuthFooterLinks Component
 * 
 * Displays footer links for authentication pages.
 * 
 * Features:
 * - Responsive design (hidden on mobile)
 * - Accessibility support
 * - Semantic HTML
 */
const AuthFooterLinks = memo(() => {
  return (
    <nav 
      className={FOOTER_STYLES}
      aria-label="Footer navigation"
    >
      {FOOTER_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={LINK_STYLES}
          aria-label={link.ariaLabel}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
});

AuthFooterLinks.displayName = "AuthFooterLinks";

export default AuthFooterLinks;
  