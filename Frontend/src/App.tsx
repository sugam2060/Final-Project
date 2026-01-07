import { Routes, Route, Outlet } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import MainPage from "@/pages/MainPage";
import SocialLoginPage from "@/pages/LoginPage";
import PricingPage from "@/pages/PricingPage";
import PostJobMain from "@/pages/PostJobMain";
import CreateJobForm from "@/pages/ManualJobCreate";
import Protected from "@/components/layout/Protected";
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
  const { initialized } = useAuth();

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
    </Routes>
  );
}

export default App;
