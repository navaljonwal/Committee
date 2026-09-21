import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import PopupModal from '../components/PopupModal';
import ToastContainer from '../components/ToastContainer';

const PopupContext = createContext(null);

let toastCounter = 0;

export function PopupProvider({ children }) {
  const [modalState, setModalState] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isAlert: false,
    resolve: null
  });

  const [toasts, setToasts] = useState([]);

  // Toast removal helper
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Show Toast
  const showToast = useCallback((options) => {
    const id = ++toastCounter;
    const toastItem = typeof options === 'string' 
      ? { id, message: options, type: 'info', duration: 3500 }
      : { id, duration: 3500, type: 'info', ...options };

    setToasts((prev) => [...prev, toastItem]);

    if (toastItem.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toastItem.duration);
    }
    return id;
  }, [removeToast]);

  // Shorthand toast helpers
  const toast = useMemo(() => ({
    success: (message, title) => showToast({ message, title, type: 'success' }),
    error: (message, title) => showToast({ message, title, type: 'error' }),
    warning: (message, title) => showToast({ message, title, type: 'warning' }),
    info: (message, title) => showToast({ message, title, type: 'info' })
  }), [showToast]);

  // Show Confirmation Modal Popup
  const showConfirm = useCallback(({
    title = 'Are you sure?',
    message = 'Please confirm this action.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        open: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        isAlert: false,
        resolve
      });
    });
  }, []);

  // Show Alert Modal Popup
  const showAlert = useCallback(({
    title = 'Notice',
    message = '',
    confirmText = 'Got it',
    type = 'info'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        open: true,
        type,
        title,
        message,
        confirmText,
        cancelText: '',
        isAlert: true,
        resolve
      });
    });
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [modalState]);

  const handleModalCancel = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [modalState]);

  // Expose global window helpers so no native alert/confirm ever pops up
  useEffect(() => {
    window.showConfirm = showConfirm;
    window.showAlert = showAlert;
    window.showToast = toast;

    // Safety fallback: if legacy code calls window.alert, show toast or popup
    const originalAlert = window.alert;
    window.alert = (msg) => {
      toast.error(String(msg || ''));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showConfirm, showAlert, toast]);

  const contextValue = useMemo(() => ({
    showConfirm,
    showAlert,
    toast,
    showToast
  }), [showConfirm, showAlert, toast, showToast]);

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      <PopupModal
        modalState={modalState}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
}
