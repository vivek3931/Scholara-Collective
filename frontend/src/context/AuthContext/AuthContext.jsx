  import React, { createContext, useContext, useState, useEffect } from "react";
  import * as api from "../../api.js";

  // Create the context
  const AuthContext = createContext(null);

  // Create the provider component
  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true); // Renamed from isLoading for clarity with registration
    const [error, setError] = useState(null); // Function to clear any active error messages

    const clearError = () => setError(null);

    useEffect(() => {
      // Load user and token from localStorage on mount
      const loadAuthData = async () => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
          } catch (e) {
            console.error("Failed to parse auth data from localStorage", e);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }
        setAuthLoading(false);
      };

      loadAuthData();
    }, []);

    const register = async (credentials) => {
      clearError(); // Clear any existing errors before starting
      setAuthLoading(true);
      try {
        // Call the API and await the response
        const response = await api.register(credentials); // Store the token and user if returned
        const { token: newToken, user: newUser } = response.data;
        if (newToken && newUser) {
          localStorage.setItem("token", newToken);
          localStorage.setItem("user", JSON.stringify(newUser));
          setToken(newToken);
          setUser(newUser);
        }
        setAuthLoading(false); // Return the result for the component to handle
        return { success: true, data: response.data };
      } catch (err) {
        setAuthLoading(false); // Set a descriptive error message from the API response or a default message
        const errorMessage =
          err.response?.data?.message || "Registration failed. Please try again.";
        setError(errorMessage);
        console.error("Registration failed:", errorMessage);
        return { success: false, error: errorMessage };
      }
    };

    const login = async (credentials) => {
      clearError();
      setAuthLoading(true);
      try {
        const { token: newToken, user: loggedInUser } = await api.login(
          credentials
        );
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setToken(newToken);
        setUser(loggedInUser);
        setAuthLoading(false);
        return loggedInUser;
      } catch (err) {
        setAuthLoading(false);
        const errorMessage =
          err.response?.data?.message ||
          "Login failed. Please check your credentials.";
        setError(errorMessage);
        console.error("Login failed:", errorMessage);
        throw err;
      }
    };

    const logout = async () => {
      try {
        await api.logout();
      } finally {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearError();
      }
    };

    const isAuthenticated = !!user && !!token;

    const value = {
      user,
      token,
      isAuthenticated,
      authLoading,
      error,
      clearError,
      login,
      logout,
      register, // Expose the new register function
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };

  // Create the custom hook to consume the context
  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };
