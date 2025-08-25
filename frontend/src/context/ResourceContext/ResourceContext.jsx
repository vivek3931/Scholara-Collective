// src/context/ResourceContext/ResourceContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext/AuthContext';
import { useModal } from '../ModalContext/ModalContext';

const ResourceContext = createContext();

export const ResourceProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const { showModal } = useModal();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const [loading, setLoading] = useState({});
    const [previewDataUrls, setPreviewDataUrls] = useState({});
    
    // Memoized value to prevent re-renders
    const actions = useMemo(() => ({
        // Action to save a resource
        saveResource: async (resourceId) => {
            if (!isAuthenticated) {
                showModal({ type: "warning", title: "Auth Required", message: "You need to be logged in to save resources.", confirmText: "Go to Login", onConfirm: () => window.location.href = "/login", cancelText: "Cancel", isDismissible: true });
                return;
            }
            if (!resourceId) {
                showModal({ type: "error", title: "Save Error", message: "Resource ID is missing.", confirmText: "OK" });
                return;
            }

            setLoading(prev => ({ ...prev, [resourceId]: true }));
            try {
                const response = await axios.put(`${API_URL}/resources/${resourceId}/save`, null, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    showModal({ type: "success", title: "Resource Saved!", message: "This resource has been added to your library!", confirmText: "Great!" });
                    // Optional: You could update user state in AuthContext here
                }
            } catch (error) {
                console.error("Save error:", error);
                showModal({ type: "error", title: "Save Error", message: error.response?.data?.msg || "Failed to save resource", confirmText: "OK" });
            } finally {
                setLoading(prev => ({ ...prev, [resourceId]: false }));
            }
        },

        // Action to unsave a resource
        unsaveResource: async (resourceId) => {
            if (!isAuthenticated) return;

            setLoading(prev => ({ ...prev, [resourceId]: true }));
            try {
                const response = await axios.put(`${API_URL}/resources/${resourceId}/unsave`, null, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    showModal({ type: "success", title: "Resource Removed", message: "The resource has been removed from your library.", confirmText: "OK" });
                }
            } catch (error) {
                console.error("Unsave error:", error);
                showModal({ type: "error", title: "Error", message: error.response?.data?.msg || "Failed to unsave resource", confirmText: "OK" });
            } finally {
                setLoading(prev => ({ ...prev, [resourceId]: false }));
            }
        },

        // Action to download a resource
        downloadResource: async (resourceId, filename) => {
            if (!isAuthenticated) return;
            setLoading(prev => ({ ...prev, [resourceId]: true }));
            try {
                const response = await axios.get(`${API_URL}/resources/${resourceId}/download`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                showModal({ type: "success", title: "Download Started", message: "Your download has started successfully!", confirmText: "OK" });
            } catch (error) {
                console.error("Download failed:", error);
                showModal({ type: "error", title: "Download Failed", message: error.response?.data?.msg || "Could not download the file.", confirmText: "Close" });
            } finally {
                setLoading(prev => ({ ...prev, [resourceId]: false }));
            }
        },
        
        // Action to flag a resource
        flagResource: async (resourceId, reason) => {
            if (!isAuthenticated) return;
            setLoading(prev => ({ ...prev, [resourceId]: true }));
            try {
                const response = await axios.post(`${API_URL}/resources/${resourceId}/flag`, { reason }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    showModal({ type: "success", title: "Resource Flagged", message: "Thank you for helping maintain content quality!", confirmText: "Got It" });
                }
            } catch (error) {
                console.error("Flag error:", error);
                showModal({ type: "error", title: "Flagging Error", message: error.response?.data?.msg || "Failed to flag resource", confirmText: "OK" });
            } finally {
                setLoading(prev => ({ ...prev, [resourceId]: false }));
            }
        },

        // Action to fetch a resource (could be for a single resource page)
        fetchResource: async (resourceId) => {
            setLoading(prev => ({ ...prev, [resourceId]: true }));
            try {
                const response = await axios.get(`${API_URL}/resources/${resourceId}`);
                return response.data;
            } catch (error) {
                console.error("Fetch resource error:", error);
                showModal({ type: "error", title: "Fetch Error", message: "Could not fetch resource details.", confirmText: "OK" });
                return null;
            } finally {
                setLoading(prev => ({ ...prev, [resourceId]: false }));
            }
        },

        // Action to get a preview of a resource
        previewResource: async (resourceId) => {
            if (previewDataUrls[resourceId]) {
                return previewDataUrls[resourceId];
            }
            if (!isAuthenticated) return;

            setLoading(prev => ({ ...prev, [resourceId]: true }));
            try {
                const response = await axios.get(`${API_URL}/resources/${resourceId}/preview`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                });
                const url = URL.createObjectURL(new Blob([response.data]));
                setPreviewDataUrls(prev => ({ ...prev, [resourceId]: url }));
                return url;
            } catch (error) {
                console.error("Preview failed:", error);
                showModal({ type: "error", title: "Preview Failed", message: error.response?.data?.msg || "Could not generate preview.", confirmText: "OK" });
                return null;
            } finally {
                setLoading(prev => ({ ...prev, [resourceId]: false }));
            }
        }
    }), [isAuthenticated, token, showModal, API_URL, previewDataUrls]);

    return (
        <ResourceContext.Provider value={{
            ...actions,
            loading,
            previewDataUrls
        }}>
            {children}
        </ResourceContext.Provider>
    );
};

export const useResourceActions = () => {
    const context = useContext(ResourceContext);
    if (context === undefined) {
        throw new Error('useResourceActions must be used within a ResourceProvider');
    }
    return context;
};