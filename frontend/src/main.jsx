import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider, 
} from 'react-router-dom';

import LoginPage from './pages/Login/LoginPage.jsx'; 
import RegisterPage from './pages/Register/RegisterPage.jsx'; 
import ResourcesSection from './components/ResourceSection/ResourceSection.jsx';
import AboutPage from './components/About/About.jsx'
import { AuthProvider } from './context/AuthContext/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoutes.jsx';
import UploadPage from './pages/UploadPage/UploadPage.jsx';
import SavedResourcesPage from './components/SavedResources/SavedResources.jsx';

// Define your routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
    <Route path="/" element={<App />}/>,
    <Route path="/login" element={<LoginPage />} />,
    <Route path="/register" element={<RegisterPage />} />
      <Route path="/about" element={<AboutPage />} />
    <Route  element={<ProtectedRoute />}>
      <Route path="/resources" element={<ResourcesSection />} />

      <Route path='/upload' element={<UploadPage/>}/>
      <Route path='/saved' element={<SavedResourcesPage/>}/>
      <Route path="*" element={<div><h1>404 - Page Not Found</h1><p>Sorry, the page you are looking for does not exist.</p></div>} />
    </Route>
    </>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);