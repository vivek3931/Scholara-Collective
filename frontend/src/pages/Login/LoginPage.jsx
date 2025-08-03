import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const API_URL = import.meta.env.APP_API_URL || 'http://localhost:5000/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.token);
                navigate('/');
            } else {
                setError(data.msg || 'Login failed.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Server error. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-platinum/80 dark:bg-onyx transition-colors duration-200 p-4 font-poppins animate-fade-in">
            <div className="bg-white dark:bg-onyx/90 p-8 rounded-xl shadow-glow-sm w-full max-w-md border border-gray-200 dark:border-onyx transition-colors duration-200">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-6 font-poppins">Login to Scholara Collective</h2>
                {error && <p className="bg-amber-50/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 p-3 rounded-md mb-4 text-center font-poppins border border-amber-200 dark:border-amber-800">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
                    <div>
                        <label className="block text-charcoal dark:text-platinum text-sm font-semibold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx/90 border border-gray-300 dark:border-gray-600 text-charcoal dark:text-platinum focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-200"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-charcoal dark:text-platinum text-sm font-semibold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx/90 border border-gray-300 dark:border-gray-600 text-charcoal dark:text-platinum focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-200"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-amber-500 text-white p-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 shadow-glow-sm"
                    >
                        Login
                    </button>
                </form>
                <p className="text-center text-gray-600 dark:text-platinum mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors duration-200 underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;