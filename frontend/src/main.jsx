import React, { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx"; // App is now your Home Page component
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

// Context Providers
import { AuthProvider } from "./context/AuthContext/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeProvider/ThemeProvider.jsx";
import { ModalProvider } from "./context/ModalContext/ModalContext.jsx";
import { HelmetProvider } from "react-helmet-async";

// Component Imports
import CustomWarningModal from "./components/CustomWarningModal/CustomWarningModal.jsx";
import ChatbotToggle from "./components/ChatbotToggle/ChatbotToggle.jsx";
import Loader from "./components/Loader/Loader.jsx";
import Contact from "./components/Contact/Contact.jsx";
// import ChatBot from "./components/Chatbot/Chatbot.jsx";
import MobileFrame from "./components/ScholaraFeatures/IphonePreview.jsx";
import SearchResults from "./components/SearchResult/SearchResult.jsx";
import Layout from "./Layout"; // Correctly import your custom Layout component

// Use React.lazy() for all page components to enable code splitting
const LoginPage = React.lazy(() => import("./pages/Login/LoginPage.jsx"));
const RegisterPage = React.lazy(() =>
  import("./pages/Register/RegisterPage.jsx")
);
const ProtectedRoute = React.lazy(() =>
  import("./components/ProtectedRoute/ProtectedRoutes.jsx")
);
const UploadPage = React.lazy(() =>
  import("./pages/UploadPage/UploadPage.jsx")
);
const SavedResourcesPage = React.lazy(() =>
  import("./components/SavedResources/SavedResources.jsx")
);
const AdminDashboard = React.lazy(() =>
  import("./components/AdminDashboard/AdminDashboard.jsx")
);
const AdminUsers = React.lazy(() =>
  import("./components/AdminUsers/AdminUsers.jsx")
);
const AdminResources = React.lazy(() =>
  import("./components/AdminResources/AdminResources.jsx")
);
const AdminSetup = React.lazy(() =>
  import("./components/AdminSetup/AdminSetup.jsx")
);
const AdminLayout = React.lazy(() => import("./AdminLayout.jsx"));
const Profile = React.lazy(() =>
  import("./components/UserProfile/UserProfile.jsx")
);
const Settings = React.lazy(() =>
  import("./components/SettingPage/SettingPage.jsx")
);
const AdminSettings = React.lazy(() =>
  import("./components/AdminSetting/AdminSetting.jsx")
);
const ContributorsPage = React.lazy(() =>
  import("./components/ContributorsPage/ContributorsPage.jsx")
);
const ResourceDetailPage = React.lazy(() =>
  import("./components/ResourceDetailPage/ResourceDetailPage.jsx")
);
const FullPageResources = React.lazy(() =>
  import("./components/ResourcesSection/ResourcesSection.jsx")
);
const AboutPage = React.lazy(() => import("./components/About/About.jsx"));
const ReferralPage = React.lazy(() =>
  import("./components/ReferralPage/ReferralPage.jsx")
);

// The main router with Suspense wrappers
const router = createBrowserRouter(
  createRoutesFromElements(
    // The Layout component now wraps all routes that need the consistent Navbar and Footer.
    // It is rendered as the element for the root path.
    // All other routes are nested inside it.
    <Route path="/" element={<Layout />}>
      {/* App.jsx is now the index route, meaning it's the component rendered at "/" */}
      <Route
        index
        element={
          <Suspense fallback={<Loader message="Loading Home Page..." />}>
            <App /> {/* App.jsx component renders as the Home Page */}
          </Suspense>
        }
      />

      {/* Public routes wrapped in Suspense */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<Loader message="Loading Login..." />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<Loader message="Loading Register..." />}>
            <RegisterPage />
          </Suspense>
        }
      />

      <Route
        path="/contributors"
        element={
          <Suspense fallback={<Loader message="Loading Contributors..." />}>
            <ContributorsPage />
          </Suspense>
        }
      />
      <Route
        path="/about"
        element={
          <Suspense fallback={<Loader message="Loading About..." />}>
            <AboutPage />
          </Suspense>
        }
      />
      <Route
        path="/contact"
        element={
          <Suspense fallback={<Loader message="Loading Contact..." />}>
            <Contact />
          </Suspense>
        }
      />
      <Route
        path="/referral"
        element={
          <Suspense fallback={<Loader message="Loading Referral..." />}>
            <ReferralPage />
          </Suspense>
        }
      />
      <Route
        path="/settings"
        element={
          <Suspense fallback={<Loader message="Loading Settings..." />}>
            <Settings />
          </Suspense>
        }
      />
      <Route
        path="/mobile"
        element={
          <Suspense fallback={<Loader message="Loading Mobile Frame..." />}>
            <MobileFrame />
          </Suspense>
        }
      />
      {/* <Route path="/chatbot" element={<ChatBot />} /> */}

      <Route
        path="/resources/:resourceId"
        element={
          <Suspense fallback={<Loader message="Loading Resource Details..." />}>
            <ResourceDetailPage />
          </Suspense>
        }
      />

      <Route
        path="/setup/admin"
        element={
          <Suspense fallback={<Loader message="Loading Admin Setup..." />}>
            <AdminSetup />
          </Suspense>
        }
      />

      {/* Protected routes wrapped in ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/resources"
          element={
            <Suspense fallback={<Loader message="Loading Resources..." />}>
              <FullPageResources isFullPage={true} showSearchControls={true} />
            </Suspense>
          }
        />
        <Route
          path="/upload"
          element={
            <Suspense fallback={<Loader message="Loading Upload..." />}>
              <UploadPage />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<Loader message="Loading Profile..." />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="/search"
          element={
            <Suspense fallback={<Loader message="Loading Search Results..." />}>
              <SearchResults />
            </Suspense>
          }
        />
        <Route
          path="/saved"
          element={
            <Suspense
              fallback={<Loader message="Loading Saved Resources..." />}
            >
              <SavedResourcesPage />
            </Suspense>
          }
        />
      </Route>

      {/* Admin protected routes wrapped in ProtectedRoute */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route
          path="/admin"
          element={
            <Suspense fallback={<Loader message="Loading Admin Panel..." />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<Loader message="Loading Dashboard..." />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<Loader message="Loading Users..." />}>
                <AdminUsers />
              </Suspense>
            }
          />
          <Route
            path="resources"
            element={
              <Suspense
                fallback={<Loader message="Loading Admin Resources..." />}
              >
                <AdminResources />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense
                fallback={<Loader message="Loading Admin Settings..." />}
              >
                <AdminSettings />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* 404 route */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
                404
              </h1>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                Page Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sorry, the page you are looking for does not exist.
              </p>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        }
      />
    </Route> // Closing tag for the main Layout route
  )
);

// Main application wrapper with providers
const AppWithProviders = () => (
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ModalProvider>
          <RouterProvider router={router} />
          <CustomWarningModal />
          <ChatbotToggle />
        </ModalProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);

// Render the application, wrapping everything in HelmetProvider
createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <AppWithProviders />
  </HelmetProvider>
);
