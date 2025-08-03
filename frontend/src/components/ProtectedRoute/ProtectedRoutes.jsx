// src/components/ProtectedRoute/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth(); // Get isAuthenticated and loading state from context

    // While authentication status is being loaded, you might want to show a loading spinner
    // or simply render nothing to prevent flickering.
    if (loading) {
        return (
            <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'rgba(255,255,255,0.8)'
            }}>
            <div style={{
                border: '6px solid #f3f3f3',
                borderTop: '6px solid #3498db',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                animation: 'spin 1s linear infinite'
            }} />
            <div style={{ marginTop: 20, fontSize: 18, color: '#3498db' }}>
                Loading user session...
            </div>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
            </div>
        );
    }

    // If the user is authenticated, render the child routes/components
    // Otherwise, redirect them to the login page
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;