import { memo } from 'preact/compat';
import type { ChatMessage } from './types';
import { formatTimestamp } from '../../utils/messageUtils';
import { formatFileSize, getFileIcon, downloadFile } from '../../utils/fileUtils';
import { Paper } from '@/ui-component/Paper/Paper';
import { Typography } from '@/ui-component/Typography/Typography';
import { Flex } from '@/ui-component/Layout/Flex';
import { Box } from '@/ui-component/Layout/Box';
import { IconButton } from '@/ui-component/Button/IconButton';
import { IconDownload } from '@tabler/icons-react';
import './Chat.scss';

interface ChatMessageItemProps {
  message: ChatMessage;
  onImageClick?: (url: string, fileName: string) => void;
  classNamePrefix?: string;
}

function ChatMessageItemComponent({ message, onImageClick }: ChatMessageItemProps) {
  const isOwnMessage = message.type === 'sent';

  return (
    <Flex direction="column" align={isOwnMessage ? 'flex-end' : 'flex-start'} style={{ width: '100%' }}>
      <Flex direction="column" align={isOwnMessage ? 'flex-end' : 'flex-start'} style={{ maxWidth: '70%' }}>
        <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
          <Typography variant="caption" color="text-secondary">
            {message.senderId ? message.senderId.substring(0, 6) : '알 수 없음'}
          </Typography>
          <Typography variant="caption" color="text-tertiary">
            {formatTimestamp(message.timestamp)}
          </Typography>
        </Flex>
        <Paper
          elevation={1}
          padding="sm"
          style={{
            borderRadius: isOwnMessage ? '12px 0 12px 12px' : '0 12px 12px 12px',
            backgroundColor: isOwnMessage ? 'var(--color-interactive-primary)' : 'var(--color-surface-level-1)',
            color: isOwnMessage ? 'var(--primitive-gray-0)' : 'inherit',
          }}
        >
          {message.fileData ? (
            <Box>
              {message.fileData.fileType === 'image' ? (
                <Box style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={message.fileData.data}
                    alt={message.fileData.fileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: 'var(--shape-radius-md)',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                    onClick={() => onImageClick?.(message.fileData!.data, message.fileData!.fileName)}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(message.fileData!.fileName, message.fileData!.data, message.fileData!.mimeType);
                    }}
                    style={{
                      position: 'absolute',
                      top: 'var(--space-gap-xs)',
                      right: 'var(--space-gap-xs)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                    }}
                  >
                    <IconDownload size={16} />
                  </IconButton>
                </Box>
              ) : (
                <Flex align="center" gap="sm">
                  <Box style={{ fontSize: '1.5rem' }}>{getFileIcon(message.fileData.mimeType)}</Box>
                  <Box style={{ flex: 1 }}>
                    <Typography variant="body-medium" style={{ fontWeight: 500 }}>
                      {message.fileData.fileName}
                    </Typography>
                    <Typography variant="caption">{formatFileSize(message.fileData.size)}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() =>
                      downloadFile(message.fileData!.fileName, message.fileData!.data, message.fileData!.mimeType)
                    }
                  >
                    <IconDownload size={18} />
                  </IconButton>
                </Flex>
              )}
            </Box>
          ) : (
            <Typography variant="body-medium">{message.content}</Typography>
          )}
        </Paper>
      </Flex>
    </Flex>
  );
}

// memo로 메모이제이션하여 message가 변경되지 않으면 리렌더링 방지
export const ChatMessageItem = memo(ChatMessageItemComponent, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id && prevProps.classNamePrefix === nextProps.classNamePrefix;
});
