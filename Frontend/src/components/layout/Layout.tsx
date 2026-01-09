import { memo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout Component
 * 
 * Main layout wrapper for the application.
 * 
 * Features:
 * - Consistent header and footer
 * - Responsive design
 * - Semantic HTML structure
 */
const Layout = memo(function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
});

Layout.displayName = "Layout";

export default Layout;