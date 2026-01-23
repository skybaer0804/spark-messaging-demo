import { memo, useState } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconX, IconDownload, IconPhotoOff } from '@tabler/icons-preact';
import { downloadFileFromUrl } from '@/core/utils/fileUtils';
import { Typography } from '@/ui-components/Typography/Typography';
import './Chat.scss';

interface ImageModalProps {
  url: string;
  fileName: string;
  onClose: () => void;
  classNamePrefix?: string;
}

function ImageModalComponent({ url, fileName, onClose }: ImageModalProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleDownload = async (e: Event) => {
    e.stopPropagation();
    await downloadFileFromUrl(url, fileName);
  };

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
        {/* 닫기 버튼 */}
        <IconButton
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-3rem',
            right: '3rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--primitive-gray-0)',
          }}
        >
          <IconX size={24} />
        </IconButton>

        {/* 다운로드 버튼 */}
        <IconButton
          onClick={handleDownload}
          style={{
            position: 'absolute',
            top: '-3rem',
            right: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--primitive-gray-0)',
          }}
        >
          <IconDownload size={24} />
        </IconButton>

        {/* 이미지 또는 에러 표시 */}
        {imageError ? (
          <Box
            style={{
              width: '400px',
              height: '300px',
              backgroundColor: 'var(--color-surface-level-1)',
              borderRadius: 'var(--shape-radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-gap-md)',
            }}
          >
            <IconPhotoOff size={48} style={{ opacity: 0.5 }} />
            <Typography variant="body-medium" color="text-secondary">
              이미지를 불러올 수 없습니다
            </Typography>
            <Typography variant="caption" color="text-tertiary">
              {fileName}
            </Typography>
          </Box>
        ) : (
          <>
            {imageLoading && (
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'var(--color-surface-level-1)',
                  borderRadius: 'var(--shape-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body-medium" color="text-secondary">
                  로딩 중...
                </Typography>
              </Box>
            )}
            <img
              src={url}
              alt={fileName}
              width={800}
              height={600}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: 'var(--shape-radius-md)',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.2s',
                aspectRatio: 'auto',
              }}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </>
        )}
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
