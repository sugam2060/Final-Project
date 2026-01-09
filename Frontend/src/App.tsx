import { memo, useEffect, useMemo } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import MainPage from "@/pages/MainPage";
import SocialLoginPage from "@/pages/LoginPage";
import PricingPage from "@/pages/PricingPage";
import PostJobMain from "@/pages/PostJobMain";
import CreateJobForm from "@/pages/ManualJobCreate";
import ViewJobs from "@/pages/ViewJobs";
import EditJob from "@/pages/EditJob";
import JobListing from "@/pages/JobListing";
import JobDetail from "@/pages/JobDetail";
import JobApplications from "@/pages/JobApplications";
import ApplyJob from "@/pages/ApplyJob";
import Protected from "@/components/layout/Protected";
import ProtectedRole from "@/components/layout/ProtectedRole";
import { useAuth } from "@/Hook/AuthContext";
import AIJobPosting from "./pages/AIJobPosting";

/* ------------------------------------------------------------------ */
/* Post Route Wrapper                                                  */
/* ------------------------------------------------------------------ */

const PostRoute = memo(function PostRoute() {
  return <Outlet />;
});

PostRoute.displayName = "PostRoute";

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Main App Component
 * 
 * Handles routing and payment callback processing.
 * 
 * Features:
 * - Route configuration
 * - Payment success callback handling
 * - Protected routes
 * - Role-based access control
 */
function App() {
  const { initialized, fetchUser } = useAuth();
  const location = useLocation();

  // When redirected back from eSewa with payment success, refresh user info
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment");

    if (paymentStatus === "success") {
      // Fetch latest user data (updated plan/role) into Zustand store
      fetchUser().catch((err) => {
        console.error("Failed to refresh user after payment:", err);
      });
    }
  }, [location.search, fetchUser]);

  // Memoize route configuration to prevent unnecessary re-renders
  const routes = useMemo(
    () => (
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <Layout>
              <MainPage />
            </Layout>
          }
        />

        <Route path="/login" element={<SocialLoginPage />} />

        {/* Public Job Listing */}
        <Route
          path="/jobs/browse"
          element={
            <Layout>
              <JobListing />
            </Layout>
          }
        />

        {/* Public Job Detail */}
        <Route
          path="/jobs/view/:id"
          element={
            <Layout>
              <JobDetail />
            </Layout>
          }
        />

        {/* Public Job Application */}
        <Route
          path="/jobs/view/:id/apply"
          element={
            <Layout>
              <Protected>
                <ApplyJob />
              </Protected>
            </Layout>
          }
        />

        {/* Protected single route */}
        <Route
          path="/plans"
          element={
            <Layout>
              <Protected>
                <PricingPage />
              </Protected>
            </Layout>
          }
        />

        {/* 🔐 Protected POST routes */}
        <Route
          path="/post"
          element={
            <Layout>
              <Protected>
                <PostRoute />
              </Protected>
            </Layout>
          }
        >
          {/* /post */}
          <Route index element={<PostJobMain />} />

          {/* /post/manual-post */}
          <Route path="manual-post" element={<CreateJobForm />} />
          <Route path="automate-post" element={<AIJobPosting />} />
        </Route>

        {/* 🔐 Protected View Jobs route (role: both) */}
        <Route
          path="/jobs"
          element={
            <Layout>
              <ProtectedRole requiredRole="both">
                <ViewJobs />
              </ProtectedRole>
            </Layout>
          }
        />

        {/* 🔐 Protected Edit Job route (role: both) */}
        <Route
          path="/job/:id"
          element={
            <Layout>
              <ProtectedRole requiredRole="both">
                <EditJob />
              </ProtectedRole>
            </Layout>
          }
        />

        {/* 🔐 Protected Job Applications route (role: both) */}
        <Route
          path="/job/applicant/:id"
          element={
            <Layout>
              <ProtectedRole requiredRole="both">
                <JobApplications />
              </ProtectedRole>
            </Layout>
          }
        />
      </Routes>
    ),
    []
  );

  if (!initialized) {
    return null;
  }

  return routes;
}

export default App;
