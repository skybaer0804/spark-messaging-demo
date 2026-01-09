import { memo } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconX } from '@tabler/icons-react';
import './Chat.scss';

interface ImageModalProps {
  url: string;
  fileName: string;
  onClose: () => void;
  classNamePrefix?: string;
}

function ImageModalComponent({ url, fileName, onClose }: ImageModalProps) {
  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-background-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-padding-card-lg)',
      }}
      onClick={onClose}
    >
      <Box
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-3rem',
            right: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--primitive-gray-0)',
          }}
        >
          <IconX size={24} />
        </IconButton>
        <img
          src={url}
          alt={fileName}
          style={{
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: 'var(--shape-radius-md)',
          }}
        />
      </Box>
    </Box>
  );
}

// memo로 메모이제이션하여 url과 fileName이 변경되지 않으면 리렌더링 방지
export const ImageModal = memo(ImageModalComponent, (prevProps, nextProps) => {
  return (
    prevProps.url === nextProps.url &&
    prevProps.fileName === nextProps.fileName &&
    prevProps.classNamePrefix === nextProps.classNamePrefix
  );
});
