import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence , motion} from 'framer-motion';
import LoginPage from './pages/Login/LoginPage.jsx';
import RegisterPage from './pages/Register/RegisterPage.jsx';
import ResourcesSection from './components/ResourcesSection/ResourcesSection.jsx';
import AboutPage from './components/About/About.jsx';
import { AuthProvider } from './context/AuthContext/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeProvider/ThemeProvider.jsx';
import { ModalProvider } from './context/ModalContext/ModalContext.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoutes.jsx';
import UploadPage from './pages/UploadPage/UploadPage.jsx';
import SavedResourcesPage from './components/SavedResources/SavedResources.jsx';
import AdminDashboard from './components/AdminDashboard/AdminDashboard.jsx';
import AdminUsers from './components/AdminUsers/AdminUsers.jsx';
import AdminResources from './components/AdminResources/AdminResources.jsx';
import AdminSetup from './components/AdminSetup/AdminSetup.jsx';
import AdminLayout from './AdminLayout.jsx';
import Profile from './components/UserProfile/UserProfile.jsx';
import Settings from './components/SettingPage/SettingPage.jsx';
import AdminSettings from './components/AdminSetting/AdminSetting.jsx';
import CustomWarningModal from './components/CustomWarningModal/CustomWarningModal.jsx';
import ChatbotToggle from './components/ChatbotToggle/ChatbotToggle.jsx';

// Animation variants for route transitions
const routeVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// Wrapper component for animated routes
const AnimatedRoute = ({ children }) => {
  return (
    <motion.div
      variants={routeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1"
    >
      {children}
    </motion.div>
  );
};

// Define routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />} />
      <Route 
        path="/login" 
        element={
          <AnimatedRoute>
            <LoginPage />
          </AnimatedRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <AnimatedRoute>
            <RegisterPage />
          </AnimatedRoute>
        } 
      />
      <Route 
        path="/about" 
        element={
          <AnimatedRoute>
            <AboutPage />
          </AnimatedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <AnimatedRoute>
            <Settings />
          </AnimatedRoute>
        } 
      />
      <Route 
        path="/setup/admin" 
        element={
          <AnimatedRoute>
            <AdminSetup />
          </AnimatedRoute>
        } 
      />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/resources"
          element={
            <AnimatedRoute>
              <ResourcesSection isFullPage={true} showSearchControls={true} />
            </AnimatedRoute>
          }
        />
        <Route 
          path="/upload" 
          element={
            <AnimatedRoute>
              <UploadPage />
            </AnimatedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <AnimatedRoute>
              <Profile />
            </AnimatedRoute>
          } 
        />
        <Route 
          path="/saved" 
          element={
            <AnimatedRoute>
              <SavedResourcesPage />
            </AnimatedRoute>
          } 
        />
      </Route>
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route 
          path="/admin" 
          element={
            <AnimatedRoute>
              <AdminLayout />
            </AnimatedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <AnimatedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-center"
              >
                <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
                  404
                </h1>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                  Page Not Found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Sorry, the page you are looking for does not exist.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Back
                </motion.button>
              </motion.div>
            </div>
          </AnimatedRoute>
        }
      />
    </>
  )
);

// Main App Wrapper with Animation Context
const AppWithAnimations = () => {
  // const location = useLocation();

  return (
    <AnimatePresence  >
      <RouterProvider router={router} key={location.pathname} />
      <CustomWarningModal />
      <ChatbotToggle />
    </AnimatePresence>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ModalProvider>
          <AppWithAnimations />
        </ModalProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);