import React, { useState, useEffect } from 'react';
import { Mail, Key, Rocket, Loader, CheckCircle2, XCircle, User as UserIcon, ChevronDown, Shield, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// This is the actual function that will communicate with your backend API.
const createInitialAdmin = async (email, password, secretKey, username) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/setup-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // The formData object is sent as the request body
            body: JSON.stringify({ email, password, secretKey, username }),
        });

        const data = await response.json();

        // Check if the response was successful
        if (response.ok) {
            return {
                success: true,
                message: data.message,
            };
        } else {
            return {
                success: false,
                message: data.message || 'Failed to create admin account.',
            };
        }

    } catch (error) {
        console.error("Network error creating initial admin:", error);
        return {
            success: false,
            message: `Network error: ${error.message}. Please try again.`,
        };
    }
};

// Component for the one-time admin setup page
const AdminSetup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        secretKey: '',
        role: 'admin', // Default role
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null); // { success: boolean, message: string }
    const [showPassword, setShowPassword] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

    // Available admin roles
    const adminRoles = [
        { value: 'admin', label: 'Admin', description: 'Full system access' },
        { value: 'moderator', label: 'Moderator', description: 'Content management access' },
        { value: 'editor', label: 'Editor', description: 'Limited editing access' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role: role.value }));
        setRoleDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);

        const { username, email, password, secretKey } = formData;
        // Basic frontend validation to ensure all fields are filled
        if (!username || !email || !password || !secretKey) {
            setStatus({ success: false, message: "All fields are required." });
            setIsLoading(false);
            return;
        }

        try {
            // Pass username to the API function
            const result = await createInitialAdmin(email, password, secretKey, username);
            setStatus(result);
            if (result.success) {
                // Redirect to login after successful creation
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            console.error("Error creating initial admin:", error);
            setStatus({ success: false, message: "An unexpected error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedRole = adminRoles.find(role => role.value === formData.role);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        First Admin Setup
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        This is a one-time process to create the primary administrator account.
                    </p>
                </div>

                {status && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in border ${
                        status.success 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                        {status.success ? 
                            <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" /> : 
                            <XCircle className="text-red-600 dark:text-red-400 flex-shrink-0" />
                        }
                        <p className={`text-sm font-medium ${
                            status.success 
                                ? 'text-green-800 dark:text-green-200' 
                                : 'text-red-800 dark:text-red-200'
                        }`}>
                            {status.message}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Secret Key Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="secretKey">
                            Admin Secret Key
                        </label>
                        <div className="relative">
                            <input
                                type={showSecretKey ? "text" : "password"}
                                id="secretKey"
                                name="secretKey"
                                value={formData.secretKey}
                                onChange={handleChange}
                                required
                                className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter your secret key"
                            />
                            <Key size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            <button
                                type="button"
                                onClick={() => setShowSecretKey(!showSecretKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showSecretKey ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            This key is a one-time password configured on the server.
                        </p>
                    </div>
                    
                    {/* Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="username">
                            Username
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter your username"
                            />
                            <UserIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter your email address"
                            />
                            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter a secure password"
                            />
                            <Key size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Role Dropdown - Styled like your AdminProducts component */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Admin Role
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                                className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-left text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <Shield size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                <div className="pl-7">
                                    <div className="font-medium">{selectedRole?.label}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{selectedRole?.description}</div>
                                </div>
                                <ChevronDown 
                                    size={20} 
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                                        roleDropdownOpen ? 'rotate-180' : ''
                                    }`} 
                                />
                            </button>
                            
                            {roleDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                                    {adminRoles.map((role) => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => handleRoleSelect(role)}
                                            className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                                                formData.role === role.value 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                                    : 'text-gray-900 dark:text-white'
                                            }`}
                                        >
                                            <div className="font-medium">{role.label}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{role.description}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-6 rounded-lg text-lg font-medium text-white transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
                            isLoading 
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:scale-[1.01] shadow-md'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader className="animate-spin" size={24} />
                                <span>Creating Admin...</span>
                            </>
                        ) : (
                            <>
                                <Rocket size={24} />
                                <span>Create First Admin</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Additional Info */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        This setup page will be disabled after the first admin account is created.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSetup;