import { useState, useCallback, useRef } from 'react';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification interface
 */
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txId?: string;
  duration?: number;
}

/**
 * Custom hook for managing toast notifications
 * Supports multiple simultaneous toasts with auto-dismiss
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  /**
   * Add a new toast notification
   */
  const addToast = useCallback((
    type: ToastType,
    title: string,
    options?: { message?: string; txId?: string; duration?: number }
  ) => {
    const id = `toast-${++counterRef.current}-${Date.now()}`;
    const duration = options?.duration ?? (type === 'error' ? 8000 : 5000);

    const toast: Toast = {
      id,
      type,
      title,
      message: options?.message,
      txId: options?.txId,
      duration,
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  /**
   * Remove a specific toast
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, options?: { message?: string; txId?: string; duration?: number }) => {
    return addToast('success', title, options);
  }, [addToast]);

  const error = useCallback((title: string, options?: { message?: string; txId?: string; duration?: number }) => {
    return addToast('error', title, options);
  }, [addToast]);

  const info = useCallback((title: string, options?: { message?: string; duration?: number }) => {
    return addToast('info', title, options);
  }, [addToast]);

  const warning = useCallback((title: string, options?: { message?: string; duration?: number }) => {
    return addToast('warning', title, options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning,
  };
};

export default useToast;
