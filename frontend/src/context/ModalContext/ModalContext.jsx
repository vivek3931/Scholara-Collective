// ModalContext.jsx
import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null,
    cancelText: 'Cancel',
    onCancel: null,
    showCloseButton: true,
    isDismissible: true,
  });

  const showModal = ({
    type = 'warning',
    title = 'Alert',
    message = 'Something happened.',
    confirmText = 'OK',
    onConfirm = null,
    cancelText = 'Cancel',
    onCancel = null,
    showCloseButton = true,
    isDismissible = true,
  }) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      onConfirm,
      cancelText,
      onCancel,
      showCloseButton,
      isDismissible,
    });
  };

  const hideModal = () => {
    setModalState({
      isOpen: false,
      type: 'warning',
      title: '',
      message: '',
      confirmText: 'OK',
      onConfirm: null,
      cancelText: 'Cancel',
      onCancel: null,
      showCloseButton: true,
      isDismissible: true,
    });
  };

  return (
    <ModalContext.Provider value={{ modalState, showModal, hideModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);