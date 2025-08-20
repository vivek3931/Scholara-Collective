// CustomWarningModal.jsx
import React, { useEffect } from 'react';
import { XCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useModal } from '../../context/ModalContext/ModalContext'; // Adjust path if needed

const CustomWarningModal = () => {
  const { modalState, hideModal } = useModal();

  const {
    isOpen,
    type = 'warning',
    title,
    message,
    confirmText = 'OK',
    onConfirm,
    cancelText = 'Cancel',
    onCancel,
    showCloseButton = true,
    isDismissible = true,
  } = modalState;

  if (!isOpen) return null;

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
      hideModal();
    }
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (isDismissible && event.key === 'Escape') {
        hideModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDismissible, hideModal]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in custom-warning-modal"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="bg-white dark:bg-onyx rounded-xl shadow-glow-sm border border-gray-200 dark:border-gray-600 p-6 w-full max-w-sm md:max-w-md transform transition-all animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={hideModal}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-onyx rounded-full p-1"
            aria-label="Close modal"
          >
            <XCircle size={20} />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 ${iconColorClass}`}>{icon}</div>
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
              onClick={() => {
                onCancel?.();
                hideModal();
              }}
              className="px-5 py-2 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-platinum hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-onyx font-poppins"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.();
              hideModal();
            }}
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