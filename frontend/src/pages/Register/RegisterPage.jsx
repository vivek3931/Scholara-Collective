import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(''); // For client-side validation
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    
    // Get auth functions and state from context
    const { 
        register, 
        authLoading, 
        error, 
        clearError, 
        isAuthenticated 
    } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Clear errors when component mounts
    useEffect(() => {
        clearError();
        setLocalError('');
        setSuccess('');
    }, [clearError]);

    // Clear errors when user starts typing
    const handleInputChange = (setter) => (e) => {
        if (error) clearError();
        if (localError) setLocalError('');
        if (success) setSuccess('');
        setter(e.target.value);
    };

    // Client-side validation
    const validateForm = () => {
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return false;
        }
        
        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters long.');
            return false;
        }
        
        if (username.length < 3) {
            setLocalError('Username must be at least 3 characters long.');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous states
        setLocalError('');
        setSuccess('');
        clearError();

        // Client-side validation
        if (!validateForm()) {
            return;
        }

        // Call centralized register function
        const result = await register({ username, email, password });
        
        if (result.success) {
            setSuccess('Registration successful! Welcome to Scholara Collective!');
            
            // Check if auto-login happened (token returned)
            if (result.data.token) {
                // Auto-login successful, redirect to dashboard
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                // No auto-login, redirect to login page
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        }
        // Error handling is automatic through context
    };

    // Display error (prioritize local validation errors)
    const displayError = localError || error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-platinum/80 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx transition-colors duration-200 p-4 font-poppins animate-fade-in">
            <div className="bg-white dark:bg-onyx/60 p-8 rounded-xl shadow-glow-sm w-full max-w-md border border-gray-200 dark:border-onyx transition-colors duration-200">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-6 font-poppins">
                    Register for Scholara Collective
                </h2>
                
                {/* Error display */}
                {displayError && (
                    <p className="bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 p-3 rounded-md mb-4 text-center font-poppins border border-red-200 dark:border-red-800">
                        {displayError}
                    </p>
                )}
                
                {/* Success display */}
                {success && (
                    <p className="bg-green-50 dark:bg-green-950/80 text-green-700 dark:text-green-300 p-3 rounded-md mb-4 text-center font-poppins border border-green-200 dark:border-green-800">
                        {success}
                    </p>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4" aria-label="Register form">
                    <div>
                        <label className="block text-charcoal dark:text-platinum text-sm font-semibold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx/90 border border-gray-300 dark:border-charcoal text-charcoal dark:text-platinum focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-200"
                            placeholder="Enter your username (min 3 characters)"
                            value={username}
                            onChange={handleInputChange(setUsername)}
                            required
                            disabled={authLoading}
                            minLength={3}
                        />
                    </div>
                    <div>
                        <label className="block text-charcoal dark:text-platinum text-sm font-semibold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx/90 border border-gray-300 dark:border-charcoal text-charcoal dark:text-platinum focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-200"
                            placeholder="Enter your email"
                            value={email}
                            onChange={handleInputChange(setEmail)}
                            required
                            disabled={authLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-charcoal dark:text-platinum text-sm font-semibold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx/90 border border-gray-300 dark:border-charcoal text-charcoal dark:text-platinum focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-200"
                            placeholder="Enter your password (min 6 characters)"
                            value={password}
                            onChange={handleInputChange(setPassword)}
                            required
                            disabled={authLoading}
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-charcoal dark:text-platinum text-sm font-semibold mb-2" htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className={`w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx/90 border text-charcoal dark:text-platinum focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-200 ${
                                confirmPassword && password !== confirmPassword 
                                    ? 'border-red-300 dark:border-red-600' 
                                    : 'border-gray-300 dark:border-charcoal'
                            }`}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={handleInputChange(setConfirmPassword)}
                            required
                            disabled={authLoading}
                        />
                        {/* Real-time password match indicator */}
                        {confirmPassword && (
                            <p className={`text-xs mt-1 ${
                                password === confirmPassword 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-amber-500 text-white p-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {authLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Creating Account...
                            </div>
                        ) : (
                            'Register'
                        )}
                    </button>
                </form>
                
                <p className="text-center text-gray-600 dark:text-platinum mt-6">
                    Already have an account?{' '}
                    <Link 
                        to="/login" 
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors duration-200 underline"
                    >
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;