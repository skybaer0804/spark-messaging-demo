import { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { IconX } from '@tabler/icons-react';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import './Drawer.scss';

export interface DrawerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
  width?: string;
  children: preact.ComponentChildren;
}

export function Drawer({
  open,
  onClose,
  anchor = 'right',
  title,
  width = '400px',
  className = '',
  children,
  ...props
}: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="drawer__backdrop" onClick={onClose} />
      <div
        className={`drawer drawer--${anchor} ${className}`}
        style={{ width: anchor === 'left' || anchor === 'right' ? width : 'auto' }}
        {...props}
      >
        {title && (
          <div className="drawer__header">
            <Flex align="center" justify="space-between" style={{ flex: 1 }}>
              <Typography variant="h3" className="drawer__title">
                {title}
              </Typography>
              <IconButton size="small" color="default" onClick={onClose} title="닫기">
                <IconX size={20} />
              </IconButton>
            </Flex>
          </div>
        )}
        <div className="drawer__content">{children}</div>
      </div>
    </>
  );
}
