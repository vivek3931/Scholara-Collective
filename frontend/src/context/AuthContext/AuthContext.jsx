// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // <<< CHANGE THIS LINE

// Create the Auth Context
const AuthContext = createContext(null);

// Create a custom hook for easy access to the context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserFromToken = () => {
            if (token) {
                try {
                    // Use jwtDecode directly
                    const decoded = jwtDecode(token); // <<< CHANGE THIS LINE
                    // Check if token is expired
                    if (decoded.exp * 1000 < Date.now()) {
                        console.log('Token expired.');
                        logout();
                    } else {
                        setUser(decoded.user);
                    }
                } catch (error) {
                    console.error('Error decoding token:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        loadUserFromToken();
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // Use jwtDecode directly
        const decoded = jwtDecode(newToken); // <<< CHANGE THIS LINE
        setUser(decoded.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const contextValue = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading ? children : <div>Loading authentication...</div>}
        </AuthContext.Provider>
    );
};