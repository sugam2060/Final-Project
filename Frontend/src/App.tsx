import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import Protected from "@/components/layout/Protected";
import ProtectedRole from "@/components/layout/ProtectedRole";
import { useAuth } from "@/Hook/AuthContext";
import AIJobPosting from "./pages/AIJobPosting";

/* ------------------------------------------------------------------ */
/* Post Route Wrapper                                                  */
/* ------------------------------------------------------------------ */

function PostRoute() {
  return <Outlet />;
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

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

  if (!initialized) {
    return null;
  }

  return (
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
        <Route path="automate-post" element={<AIJobPosting/>} />
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
    </Routes>
  );
}

export default App;
