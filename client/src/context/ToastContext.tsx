import { createContext } from 'preact';
import { useContext, useState, useCallback, useEffect } from 'preact/hooks';
import { ToastContainer } from '../components/Toast/ToastContainer';
import { ToastProps, ToastAction } from '../components/Toast/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], duration?: number, action?: ToastAction) => number;
  showSuccess: (message: string, duration?: number) => number;
  showError: (message: string, duration?: number) => number;
  showInfo: (message: string, duration?: number) => number;
  showWarning: (message: string, duration?: number) => number;
  hideToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastIdCounter = 0;

/**
 * Toast Provider 컴포넌트
 */
export function ToastProvider({ children }: { children: any }) {
  const [toasts, setToasts] = useState<(Omit<ToastProps, 'onClose'> & { id: number })[]>([]);

  const showToast = useCallback((message: string, type: ToastProps['type'] = 'info', duration = 3000, action: ToastAction | undefined = undefined) => {
    const id = ++toastIdCounter;
    const newToast = {
      id,
      message,
      type,
      duration,
      action,
      isOpen: true,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  // 전역 API 에러 이벤트 리스너
  useEffect(() => {
    const handleApiError = (event: any) => {
      showError(event.detail || '알 수 없는 오류가 발생했습니다.');
    };

    window.addEventListener('api-error', handleApiError);
    return () => window.removeEventListener('api-error', handleApiError);
  }, [showError]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
