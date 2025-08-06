import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import LoginPage from "./pages/Login/LoginPage.jsx";
import RegisterPage from "./pages/Register/RegisterPage.jsx";
import ResourcesSection from "./components/ResourceSection/ResourceSection.jsx";
import AboutPage from "./components/About/About.jsx";
import { AuthProvider } from "./context/AuthContext/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeProvider/ThemeProvider.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoutes.jsx";
import UploadPage from "./pages/UploadPage/UploadPage.jsx";
import SavedResourcesPage from "./components/SavedResources/SavedResources.jsx";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard.jsx";
import AdminUsers from "./components/AdminUsers/AdminUsers.jsx";
import AdminResources from "./components/AdminResources/AdminResources.jsx";
import AdminSetup from "./components/AdminSetup/AdminSetup.jsx";
import AdminLayout from "./AdminLayout.jsx";
import Profile from "./components/UserProfile/UserProfile.jsx";
import Settings from "./components/SettingPage/SettingPage.jsx";
import AdminSettings from "./components/AdminSetting/AdminSetting.jsx";

// Define your routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />} />
       <Route path="/login" element={<LoginPage />} />
       <Route path="/register" element={<RegisterPage />} />
       <Route path="/about" element={<AboutPage />} />
       <Route path="/settings" element={<Settings/>}/>
       <Route path="/setup/admin" element={<AdminSetup />} />
      <Route element={<ProtectedRoute />}>
         <Route path="/resources" element={<ResourcesSection 
            isFullPage={true} 
            showSearchControls={true} 
          />} />
         <Route path="/upload" element={<UploadPage />} />
         <Route path="/profile" element={<Profile/>}/>
        <Route path="/saved" element={<SavedResourcesPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="settings" element={<AdminSettings/>}/>

          <Route
            path="settings"
            element={
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Admin settings panel coming soon...
                </p>
              </div>
            }
          />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
         <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
