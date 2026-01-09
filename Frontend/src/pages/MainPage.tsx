import { memo } from "react";
import Hero from "@/components/main/HeroSection";
import PopularJobs from "@/components/main/PopularJobs";

/**
 * MainPage Component
 * 
 * Landing page with hero section and popular job categories.
 */
const MainPage = memo(function MainPage() {
  return (
    <>
      <Hero />
      <PopularJobs />
    </>
  );
});

MainPage.displayName = "MainPage";

export default MainPage;