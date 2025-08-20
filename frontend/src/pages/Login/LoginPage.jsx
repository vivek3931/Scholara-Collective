// src/pages/Login/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext.jsx';
import { useModal } from '../../context/ModalContext/ModalContext.jsx';
import { LogIn } from 'lucide-react';
import { Helmet } from 'react-helmet-async'; // Import Helmet

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const { showModal, hideModal } = useModal();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);

        try {
            const user = await login({ email, password });

            if (user && (user.role === 'admin' || user.role === 'superadmin')) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
            showModal({
                type: 'error',
                title: 'Login Failed',
                message: errorMessage,
                confirmText: 'OK',
                onConfirm: hideModal,
                showCloseButton: true,
                isDismissible: true,
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Login - Scholar Collective</title>
                <meta name="description" content="Log in to Scholar Collective to access your academic resources and dashboard." />
            </Helmet>
            <div className="min-h-screen flex items-center justify-center  bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-onyx transition-colors duration-200 p-4 font-poppins animate-fade-in">
                <div className="bg-white dark:bg-onyx/60 p-8 rounded-xl shadow-glow-sm w-full max-w-md border border-gray-200 dark:border-onyx transition-colors duration-200">
                    <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-6 flex items-center justify-center gap-2">
                        <LogIn size={32} className="text-amber-500"/>
                        <span>Login to Scholar Collective</span>
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
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
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoggingIn}
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
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoggingIn}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-amber-500 text-white p-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingIn ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Logging in...
                                </div>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 dark:text-platinum mt-6">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors duration-200 underline"
                        >
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;