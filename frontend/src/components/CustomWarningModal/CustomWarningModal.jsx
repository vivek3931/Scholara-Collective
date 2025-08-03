import React, { useState, useEffect } from 'react';
import { XCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react'; // Icons for different warning types

/**
 * CustomWarningModal Component
 *
 * A versatile modal for displaying various types of warning, info, success, or error messages.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Callback function when the modal is requested to be closed.
 * @param {'warning' | 'error' | 'info' | 'success'} [props.type='warning'] - The type of message, which influences icon and color.
 * @param {string} props.title - The title of the modal (e.g., "Access Denied").
 * @param {string} props.message - The main message content (e.g., "Please log in to view this document.").
 * @param {string} [props.confirmText='OK'] - Text for the primary action button.
 * @param {function} [props.onConfirm] - Callback for the primary action button. If not provided, the button closes the modal.
 * @param {string} [props.cancelText='Cancel'] - Text for the secondary action button (if any).
 * @param {function} [props.onCancel] - Callback for the secondary action button. If not provided, this button won't be shown.
 * @param {boolean} [props.showCloseButton=true] - Whether to show the 'X' close button in the corner.
 * @param {boolean} [props.isDismissible=true] - Whether clicking outside or pressing Escape closes the modal.
 */
const CustomWarningModal = ({
    isOpen,
    onClose,
    type = 'warning', // 'warning', 'error', 'info', 'success'
    title,
    message,
    confirmText = 'OK',
    onConfirm,
    cancelText = 'Cancel',
    onCancel,
    showCloseButton = true,
    isDismissible = true,
}) => {
    // If the modal is not open, don't render anything
    if (!isOpen) return null;

    // Determine colors and icon based on message type
    let icon;
    let titleColorClass;
    let buttonBaseClass;
    let iconColorClass;

    switch (type) {
        case 'error':
            icon = <XCircle size={28} />;
            titleColorClass = 'text-red-700 dark:text-red-400';
            buttonBaseClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            iconColorClass = 'text-red-600 dark:text-red-400';
            break;
        case 'info':
            icon = <Info size={28} />;
            titleColorClass = 'text-blue-700 dark:text-blue-400';
            buttonBaseClass = 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
            iconColorClass = 'text-blue-600 dark:text-blue-400';
            break;
        case 'success':
            icon = <CheckCircle size={28} />;
            titleColorClass = 'text-green-700 dark:text-green-400';
            buttonBaseClass = 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            iconColorClass = 'text-green-600 dark:text-green-400';
            break;
        case 'warning':
        default:
            icon = <AlertTriangle size={28} />;
            titleColorClass = 'text-amber-700 dark:text-amber-400';
            buttonBaseClass = 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            iconColorClass = 'text-amber-600 dark:text-amber-400';
            break;
    }

    const handleBackdropClick = (e) => {
        if (isDismissible && e.target === e.currentTarget) {
            onClose();
        }
    };

    // Close on Escape key press
    useEffect(() => {
        const handleEscape = (event) => {
            if (isDismissible && event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isDismissible, onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <div
                className="bg-white dark:bg-onyx rounded-xl shadow-glow-sm border border-gray-200 dark:border-gray-600 p-6 w-full max-w-sm md:max-w-md transform transition-all animate-scale-in relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-onyx rounded-full p-1"
                        aria-label="Close modal"
                    >
                        <XCircle size={20} />
                    </button>
                )}

                <div className="flex flex-col items-center text-center">
                    <div className={`mb-4 ${iconColorClass}`}>
                        {icon}
                    </div>
                    <h3 id="modal-title" className={`text-xl font-semibold mb-2 ${titleColorClass} font-poppins`}>
                        {title}
                    </h3>
                    <p id="modal-description" className="text-gray-700 dark:text-platinum text-sm mb-6 font-poppins leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex justify-center space-x-4">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-5 py-2 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-platinum hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-onyx font-poppins font-medium"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm || onClose} // If onConfirm is not provided, the button just closes the modal
                        className={`px-5 py-2 text-white font-medium rounded-lg shadow-glow-sm transition-all duration-200 ${buttonBaseClass} focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-onyx font-poppins`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomWarningModal;