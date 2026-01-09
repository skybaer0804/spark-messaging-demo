import { memo } from 'preact/compat';
import type { Message } from '../types';
import { formatTimestamp } from '@/core/utils/messageUtils';
import { formatFileSize, getFileIcon, downloadFile } from '@/core/utils/fileUtils';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconDownload, IconCheck, IconClock, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '@/core/hooks/useAuth';
import './Chat.scss';

interface ChatMessageItemProps {
  message: Message;
  onImageClick?: (url: string, fileName: string) => void;
  classNamePrefix?: string;
}

function ChatMessageItemComponent({ message, onImageClick }: ChatMessageItemProps) {
  const { user } = useAuth();
  const isOwnMessage = message.senderId === user?.id;

  const renderStatus = () => {
    if (!isOwnMessage) return null;
    
    switch (message.status) {
      case 'sending':
        return <IconClock size={12} style={{ opacity: 0.6 }} />;
      case 'sent':
        return <IconCheck size={12} style={{ color: 'var(--color-status-success)' }} />;
      case 'failed':
        return <IconAlertCircle size={12} style={{ color: 'var(--color-status-error)' }} />;
      default:
        return null;
    }
  };

  return (
    <Flex direction="column" align={isOwnMessage ? 'flex-end' : 'flex-start'} style={{ width: '100%' }}>
      <Flex direction="column" align={isOwnMessage ? 'flex-end' : 'flex-start'} style={{ maxWidth: '70%' }}>
        <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
          {!isOwnMessage && (
            <Typography variant="caption" color="text-secondary">
              {message.senderName || (message.senderId ? message.senderId.substring(0, 6) : '알 수 없음')}
            </Typography>
          )}
          <Typography variant="caption" color="text-tertiary">
            {formatTimestamp(message.timestamp)}
          </Typography>
          {renderStatus()}
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
  return (
    prevProps.message._id === nextProps.message._id && 
    prevProps.message.status === nextProps.message.status &&
    prevProps.classNamePrefix === nextProps.classNamePrefix
  );
});
