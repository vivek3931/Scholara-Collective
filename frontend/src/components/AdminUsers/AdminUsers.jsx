import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api.js';
import { UserRound, Search, Edit, Trash2, ShieldAlert, ChevronDown, ChevronUp, Mail, Calendar, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, confirmColor }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Background overlay */}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 dark:bg-charcoal/20 backdrop-blur-sm bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal content */}
                <div className="inline-block align-bottom bg-white dark:bg-charcoal rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white dark:bg-charcoal/50 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            {confirmColor !== 'success' && (
                                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${confirmColor === 'red' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                    <ShieldAlert className={`h-6 w-6 ${confirmColor === 'red' ? 'text-red-600 dark:text-red-200' : 'text-amber-600 dark:text-amber-200'}`} aria-hidden="true" />
                                </div>
                            )}
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-charcoal/40 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        {onConfirm && (
                            <button
                                type="button"
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200 ${confirmColor === 'red' ? 'bg-red-600 hover:bg-red-700' : confirmColor === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                                onClick={onConfirm}
                            >
                                {confirmText}
                            </button>
                        )}
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-onyx-700 shadow-sm px-4 py-2 bg-white dark:bg-onyx text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-onyx-700 sm:mt-0 sm:w-auto sm:text-sm transition-colors duration-200"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', onConfirm: null, confirmText: '', cancelText: 'Cancel', confirmColor: 'amber' });
    const limit = 20;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getUsers(searchQuery, statusFilter, currentPage, limit);
            setUsers(data.users);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error('Error fetching users:', err.response?.data || err.message);
            setError('Failed to load users. Please ensure you are logged in with appropriate permissions.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, currentPage, limit]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleModalConfirm = () => {
        if (modalContent.onConfirm) {
            modalContent.onConfirm();
        }
        setShowModal(false);
    };

    const handleToggleStatus = (userId, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        setModalContent({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
            message: `Are you sure you want to ${action} this user?`,
            onConfirm: async () => {
                try {
                    await api.toggleUserStatus(userId);
                    fetchUsers();
                } catch (err) {
                    console.error(`Failed to ${action} user:`, err.response?.data?.msg || err.message);
                    setError(`Failed to ${action} user: ${err.response?.data?.msg || err.message}`);
                }
            },
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            confirmColor: 'amber',
            cancelText: 'Cancel',
        });
        setShowModal(true);
    };

    const handleDeleteUser = (userId) => {
        setModalContent({
            title: 'Delete User',
            message: 'Are you sure you want to delete this user and ALL their associated data (resources, comments, ratings)? This action is irreversible.',
            onConfirm: async () => {
                try {
                    await api.deleteUser(userId);
                    fetchUsers();
                } catch (err) {
                    console.error('Failed to delete user:', err.response?.data?.msg || err.message);
                    setError(`Failed to delete user: ${err.response?.data?.msg || err.message}`);
                }
            },
            confirmText: 'Delete',
            confirmColor: 'red',
            cancelText: 'Cancel',
        });
        setShowModal(true);
    };

    const handlePromoteUser = (userId) => {
        setModalContent({
            title: 'Promote User to Admin',
            message: 'Are you sure you want to promote this user to admin? This action typically requires Super Admin privileges.',
            onConfirm: async () => {
                try {
                    await api.promoteUserToAdmin(userId);
                    // Use a success modal instead of an alert
                    setModalContent({
                        title: 'Success!',
                        message: 'User promoted to admin successfully.',
                        onConfirm: null, // No action needed on click, just close
                        confirmText: 'Okay',
                        confirmColor: 'success',
                        cancelText: 'Close',
                    });
                    setShowModal(true);
                    fetchUsers();
                } catch (err) {
                    console.error('Failed to promote user:', err.response?.data?.msg || err.message);
                    setError(`Failed to promote user: ${err.response?.data?.msg || err.message}`);
                }
            },
            confirmText: 'Promote',
            confirmColor: 'amber',
            cancelText: 'Cancel',
        });
        setShowModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const toggleExpandUser = (userId) => {
        setExpandedUserId(expandedUserId === userId ? null : userId);
    };

    return (
        <div className="p-6 md:p-8 bg-white dark:bg-onyx rounded-2xl shadow-lg border border-gray-200 dark:border-charcoal transition-all duration-300">
            {/* Modal for all confirmations and success messages */}
            <ConfirmationModal
                isOpen={showModal}
                title={modalContent.title}
                message={modalContent.message}
                onConfirm={modalContent.onConfirm ? handleModalConfirm : null} // Conditionally pass onConfirm
                onCancel={() => setShowModal(false)}
                confirmText={modalContent.confirmText}
                cancelText={modalContent.cancelText}
                confirmColor={modalContent.confirmColor}
            />

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-poppins text-black dark:text-gray-100">
                <UserRound size={24} className="text-amber-600 dark:text-amber-200" />
                <span>User Management</span>
            </h2>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={20} className="text-amber-600 dark:text-amber-200" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by username or email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 dark:border-onyx-700 bg-white hover:bg-gray-50 dark:bg-onyx dark:hover:bg-onyx text-gray-700 dark:text-gray-200 font-poppins placeholder-gray-500 dark:placeholder-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-transparent transition-all duration-200 shadow-glow-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-300 dark:border-onyx-700 bg-white hover:bg-gray-50 dark:bg-onyx dark:hover:bg-onyx text-gray-700 dark:text-gray-200 font-poppins focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-transparent transition-all duration-200 cursor-pointer hover:border-amber-400 dark:hover:border-amber-200 shadow-glow-sm"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500 mx-auto mb-4"></div>
                        <p className="text-lg text-gray-700 dark:text-gray-200">Loading Users...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Preparing your user dashboard
                        </p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {users.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 dark:bg-onyx-800 rounded-xl shadow-sm">
                            <Search className="mx-auto h-12 w-12 text-gray-400 dark:text-amber-200" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No users found</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-300">
                                {searchQuery || statusFilter !== 'all'
                                    ? "Try adjusting your search or filter criteria."
                                    : "There are currently no users in the system."}
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {users.map((user) => (
                                <div key={user._id} className="bg-white dark:bg-onyx rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-charcoal">
                                    {/* User Summary */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-onyx/70 transition-colors grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                                        onClick={() => toggleExpandUser(user._id)}
                                    >
                                        <div className="col-span-2 md:col-span-1 flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                                                <UserRound size={20} className="text-amber-600 dark:text-amber-200" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.username}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                {user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'user'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                                                user.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                            }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Activity</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-200">
                                                ↑{user.uploadCount || 0} ↓{user.downloadCount || 0}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(user._id, user.isActive);
                                                }}
                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                    user.isActive
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50'
                                                }`}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            {expandedUserId === user._id ? (
                                                <ChevronUp className="h-5 w-5 text-gray-400 dark:text-amber-200" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-400 dark:text-amber-200" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded User Details */}
                                    <AnimatePresence>
                                        {expandedUserId === user._id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-gray-200 dark:border-charcoal p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* User Information */}
                                                    <div className="space-y-3">
                                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                                            <Mail className="mr-2 h-5 w-5 text-blue-500" />
                                                            User Information
                                                        </h3>
                                                        <div className="space-y-2">
                                                            <p className="text-gray-600 dark:text-gray-300">
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">Username:</span> {user.username}
                                                            </p>
                                                            <p className="text-gray-600 dark:text-gray-300">
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">Email:</span> {user.email}
                                                            </p>
                                                            <p className="text-gray-600 dark:text-gray-300">
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">Role:</span> {user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'user'}
                                                            </p>
                                                            <p className="text-gray-600 dark:text-gray-300">
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">Status:</span>
                                                                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                                                    user.isActive
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                                                }`}>
                                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Activity Stats */}
                                                    <div className="space-y-3">
                                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                                            <Activity className="mr-2 h-5 w-5 text-green-500" />
                                                            Activity Statistics
                                                        </h3>
                                                        <div className="space-y-2">
                                                            <div className="bg-gray-50 dark:bg-charcoal/20 p-3 rounded-lg">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Uploads</p>
                                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.uploadCount || 0}</p>
                                                            </div>
                                                            <div className="bg-gray-50 dark:bg-charcoal/20 p-3 rounded-lg">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Downloads</p>
                                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.downloadCount || 0}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions */}
                                                    <div className="space-y-3">
                                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                                            <Edit className="mr-2 h-5 w-5 text-purple-500" />
                                                            Quick Actions
                                                        </h3>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <button
                                                                onClick={() => handleToggleStatus(user._id, user.isActive)}
                                                                className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
                                                                    user.isActive
                                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30'
                                                                        : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-200 dark:hover:bg-green-900/30'
                                                                }`}
                                                            >
                                                                <Activity className="mr-2 h-4 w-4" />
                                                                {user.isActive ? 'Deactivate User' : 'Activate User'}
                                                            </button>

                                                            {(!user.roles || (!user.roles.includes('admin') && !user.roles.includes('superadmin'))) && (
                                                                <button
                                                                    onClick={() => handlePromoteUser(user._id)}
                                                                    className="flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                                                                >
                                                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                                                    Promote to Admin
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleDeleteUser(user._id)}
                                                                className="flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30 transition-colors"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete User
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminUsers;