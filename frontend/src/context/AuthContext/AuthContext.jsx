import React, { createContext, useContext, useState, useEffect } from "react";
import * as api from "../../api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const clearError = () => setError(null);

  // Enhanced setUser function that also updates localStorage
  const setUser = (userData) => {
    console.log('Setting user in AuthContext:', userData);
    
    if (typeof userData === 'function') {
      // Handle functional updates
      setUserState(prevUser => {
        const newUser = userData(prevUser);
        console.log('Functional update - new user:', newUser);
        if (newUser) {
          localStorage.setItem("user", JSON.stringify(newUser));
        }
        return newUser;
      });
    } else {
      // Handle direct updates
      console.log('Direct update - new user:', userData);
      setUserState(userData);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
    }
  };

  // Centralized function to clear authentication state and local storage
  const clearAuthAndStorage = () => {
    setUserState(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearError();
  };

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUserState(parsedUser); // Use setUserState directly here to avoid localStorage write
            setToken(storedToken);

            const isValid = await verifyTokenInBackground(storedToken);
            if (!isValid) {
              console.warn('Stored token was invalid during initialization, logging out.');
              clearAuthAndStorage();
            } else {
              // Fetch fresh data but preserve profile info
              await fetchUserDataInternal(storedToken);
            }
          } catch (e) {
            console.error("Failed to parse auth data from storage, clearing corrupted data:", e);
            clearAuthAndStorage();
          }
        }
      } catch (error) {
        console.error("Failed to load auth data from local storage:", error);
        clearAuthAndStorage();
      } finally {
        setAuthLoading(false);
        setIsInitialized(true);
      }
    };

    loadAuthData();
  }, []);

  // Set up periodic coin updates (every 5 minutes)
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {
      fetchUserCoins();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, token]);

  const verifyTokenInBackground = async (tokenToVerify) => {
    if (!tokenToVerify) {
      return false;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Token successfully verified.');
        return true;
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Token verification failed: Unauthorized or Forbidden. Token is invalid.');
        return false;
      } else {
        console.warn(`Token verification returned non-OK status ${response.status}. Keeping auth for now.`);
        return true;
      }
    } catch (error) {
      console.warn('Token verification network error (keeping auth):', error);
      return true;
    }
  };

  // Fetch complete user data (renamed from fetchUserCoinsInternal for clarity)
  const fetchUserDataInternal = async (authToken = token) => {
    if (!authToken) {
      console.warn("Cannot fetch user data: No token available.");
      return null;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const freshUserData = await response.json();
        console.log("Fresh user data from server:", freshUserData);
        
        // Update user state with fresh data from server
        setUserState(prevUser => {
          const updatedUser = { ...prevUser, ...freshUserData };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          return updatedUser;
        });
        
        return freshUserData;
      } else {
        console.error("Failed to fetch user data:", response.status);
        if (response.status === 401 || response.status === 403) {
          clearAuthAndStorage();
        }
        return null;
      }
    } catch (error) {
      console.error("Network error fetching user data:", error);
      return null;
    }
  };

  // Internal function that accepts token parameter (for initial load)
  const fetchUserCoinsInternal = async (authToken = token) => {
    if (!authToken) {
      console.warn("Cannot fetch user coins: No token available.");
      return null;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Only update coins, preserve other user data
        setUserState(prevUser => {
          const updatedUser = {
            ...prevUser,
            scholaraCoins: data.scholaraCoins
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          return updatedUser;
        });
        
        console.log("User coins updated:", data.scholaraCoins);
        return data.scholaraCoins;
      } else {
        console.error("Failed to fetch user coins:", response.status);
        if (response.status === 401 || response.status === 403) {
          clearAuthAndStorage();
        }
        return null;
      }
    } catch (error) {
      console.error("Network error fetching user coins:", error);
      return null;
    }
  };

  // --- Core Authentication Methods ---

  const register = async (credentials) => {
    clearError();
    setAuthLoading(true);
    try {
      const response = await api.register(credentials);
      setAuthLoading(false);
      return { success: true, data: response };
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
    setAuthLoading(true);
    try {
      const result = await api.sendRegistrationOtp({ email });
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
      const result = await api.verifyRegistrationOtp(userData);
      const { success, token: newToken, user: newUser, message } = result;

      if (success) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUserState(newUser);
        setAuthLoading(false);
        return { success: true, message: message };
      } else {
        setAuthLoading(false);
        setError(message);
        return {
          success: false,
          message: message,
          shouldRedirect: result.isAlreadyVerified,
          shouldResend: result.isOtpExpired,
        };
      }
    } catch (err) {
      setAuthLoading(false);
      let errorMessage = "Verification failed. Please try again.";
      let shouldRedirect = false;
      let shouldResend = false;

      if (err.response) {
        console.error("Error response from server:", err.response.data);
        console.error("Error status:", err.response.status);

        if (err.response.status === 409) {
          errorMessage = err.response.data.message || "Email already verified. Please login instead.";
          shouldRedirect = true;
        } else if (err.response.status === 400 && err.response.data.isOtpExpired) {
          errorMessage = err.response.data.message || "OTP has expired. Please request a new OTP.";
          shouldResend = true;
        } else {
          errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      } else {
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
      const { token: newToken, user: loggedInUser } = await api.login(credentials);

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setToken(newToken);
      setUserState(loggedInUser);
      setAuthLoading(false);
      
      // Fetch fresh coin data after login
      await fetchUserCoinsInternal(newToken);
      
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
    } catch (error) {
      console.warn('Logout API call failed, but clearing local auth state anyway:', error);
    } finally {
      clearAuthAndStorage();
    }
  };

  // Public function to fetch user coins (can be called manually)
  const fetchUserCoins = async () => {
    return await fetchUserCoinsInternal();
  };

  // Function to update coins locally (useful when you know coins changed)
  const updateUserCoins = (newCoins) => {
    setUserState(prevUser => {
      const updatedUser = {
        ...prevUser,
        scholaraCoins: newCoins
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Function to add/subtract coins locally and optionally sync with server
  const adjustUserCoins = async (coinChange, syncWithServer = true) => {
    // Update locally first for immediate UI feedback
    setUserState(prevUser => {
      const updatedUser = {
        ...prevUser,
        scholaraCoins: (prevUser.scholaraCoins || 0) + coinChange
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
    
    // Optionally sync with server to get the actual value
    if (syncWithServer) {
      setTimeout(() => fetchUserCoins(), 1000);
    }
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    setUser, // This now properly updates both state and localStorage
    token,
    isAuthenticated,
    authLoading,
    isInitialized,
    error,
    clearError,
    login,
    logout,
    register,
    sendRegistrationOtp,
    verifyRegistrationOtp,
    fetchUserCoins,
    updateUserCoins,
    adjustUserCoins,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};