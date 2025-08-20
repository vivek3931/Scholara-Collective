// src/pages/Register/RegisterPage.jsx
import React, { useState, useEffect , useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useModal } from '../../context/ModalContext/ModalContext.jsx';
import { UserPlus, Mail, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async'; // Import Helmet for SEO

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds

    const navigate = useNavigate();
    const {
        sendRegistrationOtp,
        verifyRegistrationOtp,
        authLoading,
        clearError,
        isAuthenticated
    } = useAuth();
    const { showModal, hideModal } = useModal();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/'); // Redirect to home or dashboard if already logged in
        }
    }, [isAuthenticated, navigate]);

    // Clear AuthContext errors on mount
    useEffect(() => {
        clearError();
    }, [clearError]);

    // OTP timer effect
    useEffect(() => {
        let timer;
        if (isOtpSent && otpTimer > 0) {
            timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
        } else if (otpTimer === 0 && isOtpSent) {
            setIsOtpSent(false); // Reset to initial form when timer expires
            showModal({
                type: 'info',
                title: 'OTP Expired',
                message: 'Your One-Time Password has expired. Please request a new OTP.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
        }
        return () => clearInterval(timer);
    }, [isOtpSent, otpTimer, hideModal, showModal]);

    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const validateRegistrationForm = useCallback(() => {
        if (password !== confirmPassword) {
            showModal({
                type: 'error',
                title: 'Validation Error',
                message: 'Passwords do not match.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
            return false;
        }
        if (password.length < 6) {
            showModal({
                type: 'error',
                title: 'Validation Error',
                message: 'Password must be at least 6 characters long.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
            return false;
        }
        if (username.length < 3) {
            showModal({
                type: 'error',
                title: 'Validation Error',
                message: 'Username must be at least 3 characters long.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
            return false;
        }
        return true;
    }, [password, confirmPassword, username.length, showModal, hideModal]); // Added dependencies

    const handleSendOtp = async (e) => {
        e.preventDefault();
        clearError();

        if (!validateRegistrationForm()) return;

        setIsSendingOtp(true);
        try {
            const result = await sendRegistrationOtp({ email });
            if (result && result.success) {
                setIsOtpSent(true);
                setOtpTimer(600); // Reset timer to 10 minutes
                showModal({
                    type: 'success',
                    title: 'OTP Sent',
                    message: 'A One-Time Password has been sent to your email. Please check your inbox (and spam folder) and enter the code below.',
                    confirmText: 'OK',
                    onConfirm: hideModal,
                });
            } else {
                showModal({
                    type: 'error',
                    title: 'Failed to Send OTP',
                    message: result.message || 'An unexpected error occurred while sending OTP. Please try again.',
                    confirmText: 'OK',
                    onConfirm: hideModal,
                });
            }
        } catch (err) {
            showModal({
                type: 'error',
                title: 'Error Sending OTP',
                message: err.response?.data?.message || 'Network error or unable to send OTP. Please try again.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtpAndRegister = async (e) => {
        e.preventDefault();
        clearError();

        if (!otp) {
            showModal({
                type: 'error',
                title: 'OTP Required',
                message: 'Please enter the One-Time Password.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
            return;
        }

        setIsVerifyingOtp(true);
        try {
            const result = await verifyRegistrationOtp({ username, email, password, otp });

            console.log('Result from verifyRegistrationOtp:', result);

            if (result && result.success) {
                showModal({
                    type: 'success',
                    title: 'Registration Successful',
                    message: 'Your account has been successfully created! Welcome to Scholara Collective!',
                    confirmText: 'Continue',
                    onConfirm: () => {
                        hideModal();
                        navigate('/');
                    },
                    showCloseButton: false,
                    isDismissible: false,
                });
            } else {
                if (result.shouldResend) {
                    setIsOtpSent(false);
                    setOtpTimer(600);
                    showModal({
                        type: 'error',
                        title: 'OTP Expired',
                        message: result.message || 'The OTP has expired. A new code has been sent. Please check your email and try again.',
                        confirmText: 'OK',
                        onConfirm: hideModal,
                    });
                } else if (result.shouldRedirect) {
                    showModal({
                        type: 'info',
                        title: 'Already Verified',
                        message: result.message || 'This email is already verified. Please login.',
                        confirmText: 'Go to Login',
                        onConfirm: () => {
                            hideModal();
                            navigate('/login');
                        },
                        showCloseButton: false,
                        isDismissible: false,
                    });
                } else {
                    showModal({
                        type: 'error',
                        title: 'Registration Failed',
                        message: result.message || 'Invalid OTP or an error occurred during registration. Please try again.',
                        confirmText: 'OK',
                        onConfirm: hideModal,
                    });
                }
            }
        } catch (err) {
            console.error('Error in handleVerifyOtpAndRegister catch block:', err);
            showModal({
                type: 'error',
                title: 'Error Verifying OTP',
                message: err.response?.data?.message || 'Network error or unable to verify OTP. Please try again.',
                confirmText: 'OK',
                onConfirm: hideModal,
            });
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <>
            {/* Add Helmet for SEO meta tags */}
            <Helmet>
                <title>{isOtpSent ? 'Verify Email - Scholara Collective' : 'Register - Scholara Collective'}</title>
                <meta name="description" content="Register for a new account on Scholara Collective and get access to academic resources. Verify your email with OTP." />
            </Helmet>

            <div className="min-h-screen flex items-center justify-center bg-platinum/80 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx transition-colors duration-200 p-4 font-poppins animate-fade-in">
                <div className="bg-white dark:bg-onyx/60 p-8 rounded-xl shadow-glow-sm w-full max-w-md border border-gray-200 dark:border-onyx transition-colors duration-200">
                    <h2 className="text-xl font-bold text-center bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-6 font-poppins flex items-center justify-center gap-2">
                        {isOtpSent ? <CheckCircle size={28} className="text-green-500"/> : <UserPlus size={28} className="text-amber-500"/>}
                        <span>{isOtpSent ? 'Verify Your Email' : 'Register for Scholara Collective'}</span>
                    </h2>

                    {!isOtpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-4" aria-label="Register form">
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
                                    disabled={authLoading || isSendingOtp}
                                    minLength={3}
                                    aria-label="Username"
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
                                    disabled={authLoading || isSendingOtp}
                                    aria-label="Email"
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
                                    disabled={authLoading || isSendingOtp}
                                    minLength={6}
                                    aria-label="Password"
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
                                    disabled={authLoading || isSendingOtp}
                                    aria-label="Confirm Password"
                                />
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
                                disabled={authLoading || isSendingOtp}
                                className="w-full bg-amber-500 text-white p-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSendingOtp ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Sending OTP...
                                    </div>
                                ) : (
                                    'Register'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4" aria-label="OTP verification form">
                            <p className="text-center text-gray-700 dark:text-gray-300 mb-4 flex flex-col items-center justify-center gap-2">
                                <Mail size={20} className="text-blue-500"/>
                                An OTP has been sent to <span className="font-bold text-amber-600 dark:text-amber-400">{email}</span>.
                                <span className="text-sm text-gray-500 dark:text-gray-400">Time remaining: {formatTime(otpTimer)}</span>
                            </p>
                            <div>
                                <label className="block text-charcoal dark:text-platinum text-sm font-semibold mb-2" htmlFor="otp">
                                    One-Time Password
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx/90 border border-gray-300 dark:border-charcoal text-charcoal dark:text-platinum focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-200 text-center tracking-widest text-lg"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => {
                                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                    }}
                                    required
                                    disabled={authLoading || isVerifyingOtp}
                                    maxLength={6}
                                    aria-label="One-Time Password"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={authLoading || isVerifyingOtp}
                                className="w-full bg-amber-500 text-white p-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifyingOtp ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Verifying OTP...
                                    </div>
                                ) : (
                                    'Verify OTP and Register'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={authLoading || isSendingOtp || isVerifyingOtp || otpTimer > 0}
                                className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-charcoal dark:text-platinum dark:hover:bg-gray-700"
                            >
                                {isSendingOtp ? 'Resending...' : 'Resend OTP'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOtpSent(false)}
                                disabled={authLoading || isVerifyingOtp}
                                className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-charcoal dark:text-platinum dark:hover:bg-gray-700 mt-2"
                            >
                                Go back to registration
                            </button>
                        </form>
                    )}

                    <p className="text-center text-gray-600 dark:text-platinum mt-6">
                        {isOtpSent ? (
                            <>
                                Changed your mind?{' '}
                                <button
                                    onClick={() => setIsOtpSent(false)}
                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors duration-200 underline"
                                    disabled={authLoading || isVerifyingOtp}
                                >
                                    Go back to registration
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors duration-200"
                                >
                                    Login here
                                </Link>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;
