import React, { createContext, useContext, useState, useEffect } from "react";
import * as api from "../../api.js"; // Assuming api.js handles your backend calls

// Create the context
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

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
    clearError();
    setAuthLoading(true);
    try {
      const response = await api.register(credentials);
      // Assuming api.register returns { message: 'Registration initiated...' }
      // No token/user expected here yet for OTP flow
      setAuthLoading(false);
      return { success: true, data: response }; // response is already response.data from api.js
    } catch (err) {
      setAuthLoading(false);
      const errorMessage =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      console.error("Registration failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const sendRegistrationOtp = async ({ email }) => {
    clearError();
    setAuthLoading(true); // Indicate loading for OTP sending
    try {
      const result = await api.sendRegistrationOtp({ email }); // api.js returns response.data directly
      setAuthLoading(false);
      return { success: true, data: result };
    } catch (err) {
      setAuthLoading(false);
      const errorMessage =
        err.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(errorMessage);
      console.error("Send OTP failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const verifyRegistrationOtp = async (userData) => {
    clearError();
    setAuthLoading(true);
    try {
      // api.verifyRegistrationOtp already returns response.data directly
      const result = await api.verifyRegistrationOtp(userData); 
      
      // Destructure directly from 'result' as it contains the backend's response.data
      const { success, token: newToken, user: newUser, message } = result; 

      if (success) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setAuthLoading(false);
        return { success: true, message: message };
      } else {
        // This 'else' block should ideally not be hit if backend always sends success:true on actual success
        // It would only be hit if backend sends 200 OK with success:false, which is not ideal API design.
        // Given your backend sends 409 for 'already verified', this path is less likely for true errors.
        setAuthLoading(false);
        setError(message);
        return {
          success: false,
          message: message,
          shouldRedirect: result.isAlreadyVerified, // Use result directly
          shouldResend: result.isOtpExpired,        // Use result directly
        };
      }
    } catch (err) {
      setAuthLoading(false);
      let errorMessage = "Verification failed. Please try again.";
      let shouldRedirect = false;
      let shouldResend = false;

      if (err.response) {
        // Server responded with a status other than 2xx
        console.error("Error response from server:", err.response.data);
        console.error("Error status:", err.response.status);

        if (err.response.status === 409) { // Conflict status for already verified
          errorMessage = err.response.data.message || "Email already verified. Please login instead.";
          shouldRedirect = true; // Flag to redirect to login
        } else if (err.response.status === 400 && err.response.data.isOtpExpired) { // Bad request with OTP expired flag
          errorMessage = err.response.data.message || "OTP has expired. Please request a new OTP.";
          shouldResend = true; // Flag to prompt resend
        } else {
          // Fallback to backend's message for other 4xx/5xx errors
          errorMessage = err.response.data.message || errorMessage; 
        }
      } else if (err.request) {
        // Request was made but no response was received (e.g., network down)
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        // Something else happened while setting up the request (e.g., Axios config error)
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      console.error("Verify OTP failed:", errorMessage);
      return { success: false, message: errorMessage, shouldRedirect, shouldResend };
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
    setUser,
    token,
    isAuthenticated,
    authLoading,
    error,
    clearError,
    login,
    logout,
    register,
    sendRegistrationOtp, // Expose the new function
    verifyRegistrationOtp, // Expose the new function
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
