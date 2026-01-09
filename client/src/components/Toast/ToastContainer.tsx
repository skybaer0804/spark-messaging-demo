import { Toast, ToastProps } from './Toast';
import './Toast.scss';

interface ToastContainerProps {
  toasts: (Omit<ToastProps, 'onClose'> & { id: number })[];
  onClose: (id: number) => void;
}

/**
 * ToastContainer 컴포넌트
 * 여러 Toast를 관리하는 컨테이너
 */
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isOpen={toast.isOpen}
          onClose={() => onClose(toast.id)}
          duration={toast.duration}
          action={toast.action}
        />
      ))}
    </div>
  );
}
