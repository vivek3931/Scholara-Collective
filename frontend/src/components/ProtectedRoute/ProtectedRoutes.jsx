// src/components/ProtectedRoute/ProtectedRoute.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext.jsx';
import Loader from '../Loader/Loader.jsx';

// This component now accepts a 'requiredRole' prop to check for specific user roles.
const ProtectedRoute = ({ requiredRole }) => {
  const { user, authLoading } = useAuth(); // Changed isLoading to authLoading for consistency

  if (authLoading) {
    // Optionally render a loading spinner or message while authentication status is being determined
    return (
      <Loader message="Checking Authentication..." />
    );
  }

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if the user has it
  if (requiredRole) {
    // FIX: Use Array.prototype.includes() to check if the user's roles array contains the required role.
    // Also, added a check for the special case where a user has the 'superadmin' role,
    // which should be considered an admin. We check if the 'superadmin' role is present.
    const hasRequiredRole = 
      user.roles.includes(requiredRole) ||
      (requiredRole === 'admin' && user.roles.includes('superadmin'));

    if (!hasRequiredRole) {
      console.warn(`Access denied: User '${user.username}' (Roles: ${user.roles.join(', ')}) tried to access a route requiring role '${requiredRole}'.`);
      return <Navigate to="/resources" replace />; // Redirect to a common logged-in route
    }
  }

  // If authenticated and has the required role (if any), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
