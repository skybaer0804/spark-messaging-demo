import { memo } from 'preact/compat';
import { formatFileSize, getFileIcon } from '../../utils/fileUtils';
import { Paper } from '@/ui-component/Paper/Paper';
import { Typography } from '@/ui-component/Typography/Typography';
import { Flex } from '@/ui-component/Layout/Flex';
import { Box } from '@/ui-component/Layout/Box';
import { IconButton } from '@/ui-component/Button/IconButton';
import { Stack } from '@/ui-component/Layout/Stack';
import { IconX } from '@tabler/icons-react';
import './Chat.scss';

interface FilePreviewProps {
  files: File[];
  uploadingFile?: File | null;
  uploadProgress?: number;
  onRemove: (index: number) => void;
  classNamePrefix?: string;
}

function FilePreviewComponent({ files, uploadingFile, uploadProgress = 0, onRemove }: FilePreviewProps) {
  if (files.length === 0 && !uploadingFile) {
    return null;
  }

  return (
    <Stack spacing="xs">
      {files.map((file: File, index: number) => (
        <Paper
          key={index}
          variant="outlined"
          padding="sm"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-gap-xs)' }}
        >
          <Box style={{ fontSize: '1.25rem' }}>{getFileIcon(file.type)}</Box>
          <Box style={{ flex: 1 }}>
            <Typography variant="body-medium" style={{ fontWeight: 500 }}>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text-tertiary">
              {formatFileSize(file.size)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => onRemove(index)} color="error">
            <IconX size={14} />
          </IconButton>
        </Paper>
      ))}
      {uploadingFile && (
        <Box
          style={{
            padding: 'var(--space-padding-card-xs) var(--space-padding-card-sm)',
            background: 'var(--color-background-secondary)',
            borderRadius: 'var(--shape-radius-sm)',
          }}
        >
          <Flex align="center" gap="sm">
            <Box style={{ flex: 1 }}>
              <Typography variant="caption" color="interactive-primary" style={{ fontWeight: 500 }}>
                {uploadingFile.name} 전송 중... {Math.round(uploadProgress)}%
              </Typography>
              <Box
                style={{
                  height: '6px',
                  width: '100%',
                  background: 'var(--color-border-default)',
                  borderRadius: 'var(--shape-radius-xs)',
                  marginTop: '4px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'var(--color-interactive-primary)',
                    borderRadius: 'var(--shape-radius-xs)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          </Flex>
        </Box>
      )}
    </Stack>
  );
}

// memo로 메모이제이션하여 files 배열과 uploadProgress가 변경되지 않으면 리렌더링 방지
export const FilePreview = memo(FilePreviewComponent, (prevProps, nextProps) => {
  return (
    prevProps.files.length === nextProps.files.length &&
    prevProps.uploadProgress === nextProps.uploadProgress &&
    prevProps.classNamePrefix === nextProps.classNamePrefix
  );
});
