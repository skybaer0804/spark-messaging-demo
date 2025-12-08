import { JSX } from 'preact';
import { IconInfoCircle, IconCheck, IconAlertTriangle, IconAlertCircle, IconX } from '@tabler/icons-react';
import './Alert.scss';

export interface AlertProps extends JSX.HTMLAttributes<HTMLDivElement> {
    severity?: 'success' | 'info' | 'warning' | 'error';
    variant?: 'filled' | 'outlined' | 'standard';
    onClose?: (event: Event) => void;
    icon?: JSX.Element | boolean;
}

export function Alert({
    severity = 'success',
    variant = 'standard',
    onClose,
    icon,
    className = '',
    children,
    ...props
}: AlertProps) {
    const defaultIcon = {
        success: <IconCheck size={22} />,
        info: <IconInfoCircle size={22} />,
        warning: <IconAlertTriangle size={22} />,
        error: <IconAlertCircle size={22} />,
    };

    const renderIcon = () => {
        if (icon === false) return null;
        if (icon) return <div className="alert__icon">{icon}</div>;
        return <div className="alert__icon">{defaultIcon[severity]}</div>;
    };

    return (
        <div
            className={`alert alert--${severity} alert--${variant} ${className}`}
            role="alert"
            {...props}
        >
            {renderIcon()}
            <div className="alert__message">{children}</div>
            {onClose && (
                <div className="alert__action">
                    <button className="alert__close-btn" onClick={onClose} aria-label="Close">
                        <IconX size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
