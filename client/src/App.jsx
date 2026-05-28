import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { CommunityProvider } from "./context/CommunityContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import GroupList from "./components/groups/GroupList";
import CreateGroup from "./components/groups/CreateGroup";
import GroupDetails from "./components/groups/GroupDetails";
import Profile from "./pages/Profile";
import CommunityFeed from "./pages/CommunityFeed";
import PostDetails from "./pages/PostDetails";

/**
 * App — Root component.
 * Sets up auth, context, routing, and toast notifications.
 *
 * Route structure:
 *  - /login, /signup → public (no auth required)
 *  - Everything else → protected (requires JWT token)
 */
export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <CommunityProvider>
          <Router>
            <Routes>
              {/* Public routes — login & signup */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes — require authentication */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/community" element={<CommunityFeed />} />
                  <Route path="/community/:id" element={<PostDetails />} />
                  <Route path="/groups" element={<GroupList />} />
                  <Route path="/groups/new" element={<CreateGroup />} />
                  <Route path="/groups/:id" element={<GroupDetails />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>
            </Routes>
          </Router>

          {/* Toast notifications — positioned bottom-center with shorter duration */}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 1500,
              style: {
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </CommunityProvider>
      </AppProvider>
    </AuthProvider>
  );
}
