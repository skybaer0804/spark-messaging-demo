import { memo } from 'preact/compat';
import type { Message, ChatUser } from '../types';
import { useState, useEffect, useRef } from 'preact/hooks';
import { formatTimestamp } from '@/core/utils/messageUtils';
import { formatFileSize, getFileIcon, downloadFile, downloadFileFromUrl } from '@/core/utils/fileUtils';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconDownload, IconCheck, IconClock, IconAlertCircle, IconPhotoOff } from '@tabler/icons-preact';
import { MarkdownRenderer } from './MarkdownRenderer/MarkdownRenderer';
import './Chat.scss';

interface ChatMessageItemProps {
  message: Message;
  currentUser?: ChatUser | null;
  onImageClick?: (url: string, fileName: string) => void;
  unreadCount?: number;
  classNamePrefix?: string;
}

function ChatMessageItemComponent({ message, currentUser, onImageClick, unreadCount }: ChatMessageItemProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 동영상/오디오 URL이 변경되면 재로드
  useEffect(() => {
    if (message.fileData?.fileType === 'video' && videoRef.current) {
      const videoUrl = message.fileData.url || message.fileData.data;
      if (videoUrl && videoRef.current.src !== videoUrl) {
        videoRef.current.load(); // 비디오 재로드
        setVideoLoading(true);
        setVideoError(false);
      }
    }
    if (message.fileData?.fileType === 'audio' && audioRef.current) {
      const audioUrl = message.fileData.url || message.fileData.data;
      if (audioUrl && audioRef.current.src !== audioUrl) {
        audioRef.current.load(); // 오디오 재로드
        setAudioLoading(true);
        setAudioError(false);
      }
    }
  }, [message.fileData?.url, message.fileData?.data, message.fileData?.fileType]);
  
  // 안전한 senderId 비교 로직
  const senderIdStr =
    typeof message.senderId === 'object' ? (message.senderId as any)?._id?.toString() : message.senderId?.toString();
  const currentUserIdStr = (currentUser as any)?.id?.toString() || currentUser?._id?.toString();

  const isOwnMessage =
    (senderIdStr && currentUserIdStr && senderIdStr === currentUserIdStr) || message.status === 'sending';

  // 파일 다운로드 핸들러 (모든 파일 타입 지원)
  const handleDownload = async (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!message.fileData) {
      console.error('파일 데이터가 없습니다.');
      return;
    }

    const { fileName, url, data, mimeType } = message.fileData;
    
    // 원본 파일 URL이 있으면 우선 사용, 없으면 표시용 데이터 사용
    const downloadUrl = url || data;
    if (!downloadUrl) {
      console.error('다운로드할 파일 URL이 없습니다.');
      return;
    }

    try {
      // URL인 경우 (http:// 또는 https://)
      if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        await downloadFileFromUrl(downloadUrl, fileName || 'download');
      } else {
        // Base64인 경우
        downloadFile(fileName || 'download', downloadUrl, mimeType || 'application/octet-stream');
      }
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      // 에러 발생 시 새 탭에서 열기 시도
      if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        window.open(downloadUrl, '_blank');
      }
    }
  };

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
              {message.senderName ||
                (typeof message.senderId === 'string' ? message.senderId.substring(0, 6) : 'Unknown')}
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
            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
            position: 'relative',
          }}
        >
          {/* 안읽음 카운트 표시 (Slack/Kakao 스타일) */}
          {unreadCount !== undefined && unreadCount > 0 && (
            <Typography
              variant="caption"
              style={{
                position: 'absolute',
                [isOwnMessage ? 'left' : 'right']: '-24px',
                bottom: '2px',
                color: 'var(--primitive-yellow-600)',
                fontWeight: 'bold',
              }}
            >
              {unreadCount}
            </Typography>
          )}
          {message.fileData ? (
            <Box>
              {message.fileData.fileType === 'image' && (message.fileData.data || message.fileData.thumbnail) ? (
                <Box style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  {imageError ? (
                    // 이미지 로드 실패 시 플레이스홀더
                    <Box
                      style={{
                        width: '300px',
                        height: '200px',
                        backgroundColor: 'var(--color-surface-level-2)',
                        borderRadius: 'var(--shape-radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-gap-sm)',
                        border: '1px dashed var(--color-border-default)',
                      }}
                    >
                      <IconPhotoOff size={32} style={{ opacity: 0.5 }} />
                      <Typography variant="caption" color="text-secondary">
                        이미지를 불러올 수 없습니다
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={handleDownload}
                        style={{
                          marginTop: 'var(--space-gap-xs)',
                        }}
                      >
                        <IconDownload size={16} />
                      </IconButton>
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
                            backgroundColor: 'var(--color-surface-level-2)',
                            borderRadius: 'var(--shape-radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" color="text-secondary">
                            로딩 중...
                          </Typography>
                        </Box>
                      )}
                      <img
                        src={message.fileData.thumbnail || message.fileData.data}
                        alt={message.fileData.fileName}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: 'var(--shape-radius-md)',
                          cursor: 'pointer',
                          display: 'block',
                          opacity: imageLoading ? 0 : 1,
                          transition: 'opacity 0.2s',
                        }}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                        onClick={() => {
                          // 원본 이미지 URL 사용 (썸네일이 아닌)
                          const originalUrl = message.fileData?.url || message.fileData?.data;
                          if (originalUrl) {
                            onImageClick?.(originalUrl, message.fileData.fileName);
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleDownload}
                        style={{
                          position: 'absolute',
                          top: 'var(--space-gap-xs)',
                          right: 'var(--space-gap-xs)',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: 'var(--primitive-gray-0)',
                        }}
                      >
                        <IconDownload size={16} />
                      </IconButton>
                    </>
                  )}
                </Box>
              ) : message.fileData.fileType === 'video' ? (
                // 동영상 파일 재생
                <Box style={{ position: 'relative', maxWidth: '100%' }}>
                  {videoError ? (
                    // 동영상 로드 실패 시 플레이스홀더
                    <Flex
                      align="center"
                      gap="sm"
                      style={{
                        padding: 'var(--space-gap-sm)',
                        borderRadius: 'var(--shape-radius-md)',
                        backgroundColor: 'var(--color-surface-level-2)',
                        minHeight: '200px',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Box style={{ fontSize: '3rem' }}>🎬</Box>
                      <Typography variant="body-medium" style={{ fontWeight: 500 }}>
                        {message.fileData.fileName}
                      </Typography>
                      <Typography variant="caption" color="text-secondary">
                        동영상을 재생할 수 없습니다
                      </Typography>
                      <IconButton size="small" onClick={handleDownload}>
                        <IconDownload size={18} />
                      </IconButton>
                    </Flex>
                  ) : (
                    <Box style={{ position: 'relative', maxWidth: '100%' }}>
                      {videoLoading && (
                        <Box
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#000',
                            borderRadius: 'var(--shape-radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                          }}
                        >
                          <Typography variant="caption" style={{ color: '#fff' }}>
                            동영상 로딩 중...
                          </Typography>
                        </Box>
                      )}
                      <video
                        ref={videoRef}
                        controls
                        style={{
                          width: '100%',
                          maxWidth: '600px',
                          maxHeight: '400px',
                          borderRadius: 'var(--shape-radius-md)',
                          backgroundColor: '#000',
                          opacity: videoLoading ? 0 : 1,
                          transition: 'opacity 0.3s',
                        }}
                        onLoadedMetadata={() => {
                          console.log('동영상 메타데이터 로드 완료:', message.fileData?.url || message.fileData?.data);
                          setVideoLoading(false);
                        }}
                        onCanPlay={() => {
                          console.log('동영상 재생 가능:', message.fileData?.url || message.fileData?.data);
                          setVideoLoading(false);
                        }}
                        onLoadStart={() => {
                          console.log('동영상 로드 시작:', message.fileData?.url || message.fileData?.data);
                        }}
                        onError={(e) => {
                          console.error('동영상 로드 에러:', e, message.fileData);
                          setVideoError(true);
                          setVideoLoading(false);
                        }}
                        preload="metadata"
                      >
                        {message.fileData?.url || message.fileData?.data ? (
                          <source 
                            src={message.fileData.url || message.fileData.data} 
                            type={message.fileData.mimeType || 'video/mp4'} 
                          />
                        ) : null}
                        브라우저가 동영상 태그를 지원하지 않습니다.
                      </video>
                      <IconButton
                        size="small"
                        onClick={handleDownload}
                        style={{
                          position: 'absolute',
                          top: 'var(--space-gap-xs)',
                          right: 'var(--space-gap-xs)',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: 'var(--primitive-gray-0)',
                          zIndex: 2,
                        }}
                      >
                        <IconDownload size={16} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ) : message.fileData.fileType === 'audio' ? (
                // 오디오 파일 재생
                <Box
                  style={{
                    padding: 'var(--space-gap-md)',
                    borderRadius: 'var(--shape-radius-md)',
                    backgroundColor: 'var(--color-surface-level-2)',
                    minWidth: '300px',
                  }}
                >
                  {audioError ? (
                    <Flex
                      align="center"
                      gap="sm"
                      style={{
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Box style={{ fontSize: '3rem' }}>🎵</Box>
                      <Typography variant="body-medium" style={{ fontWeight: 500 }}>
                        {message.fileData.fileName}
                      </Typography>
                      <Typography variant="caption" color="text-secondary">
                        오디오를 재생할 수 없습니다
                      </Typography>
                      <IconButton size="small" onClick={handleDownload}>
                        <IconDownload size={18} />
                      </IconButton>
                    </Flex>
                  ) : (
                    <Flex direction="column" gap="sm">
                      <Flex align="center" gap="sm">
                        <Box style={{ fontSize: '2rem' }}>🎵</Box>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body-medium"
                            style={{
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {message.fileData.fileName}
                          </Typography>
                          <Typography variant="caption" color="text-secondary">
                            {formatFileSize(message.fileData.size)}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={handleDownload}>
                          <IconDownload size={18} />
                        </IconButton>
                      </Flex>
                      <audio
                        ref={audioRef}
                        controls
                        style={{
                          width: '100%',
                          height: '40px',
                        }}
                        onLoadedMetadata={() => {
                          console.log('오디오 메타데이터 로드 완료:', message.fileData?.url || message.fileData?.data);
                          setAudioLoading(false);
                        }}
                        onCanPlay={() => {
                          console.log('오디오 재생 가능:', message.fileData?.url || message.fileData?.data);
                          setAudioLoading(false);
                        }}
                        onLoadStart={() => {
                          console.log('오디오 로드 시작:', message.fileData?.url || message.fileData?.data);
                        }}
                        onError={(e) => {
                          console.error('오디오 로드 에러:', e, message.fileData);
                          setAudioError(true);
                          setAudioLoading(false);
                        }}
                        preload="metadata"
                      >
                        {message.fileData?.url || message.fileData?.data ? (
                          <source 
                            src={message.fileData.url || message.fileData.data} 
                            type={message.fileData.mimeType || 'audio/mpeg'} 
                          />
                        ) : null}
                        브라우저가 오디오 태그를 지원하지 않습니다.
                      </audio>
                    </Flex>
                  )}
                </Box>
              ) : (
                // 문서 등 기타 파일 (다운로드만)
                <Flex 
                  align="center" 
                  gap="sm" 
                  style={{ 
                    padding: 'var(--space-gap-sm)',
                    borderRadius: 'var(--shape-radius-md)',
                    backgroundColor: 'var(--color-surface-level-2)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-level-3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-level-2)';
                  }}
                  onClick={handleDownload}
                >
                  <Box style={{ fontSize: '2rem' }}>{getFileIcon(message.fileData.mimeType)}</Box>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body-medium" 
                      style={{ 
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {message.fileData.fileName}
                    </Typography>
                    <Typography variant="caption" color="text-secondary">
                      {formatFileSize(message.fileData.size)}
                      {message.fileData.mimeType && (
                        <span style={{ marginLeft: 'var(--space-gap-xs)' }}>
                          • {message.fileData.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      )}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={handleDownload}
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    <IconDownload size={18} />
                  </IconButton>
                </Flex>
              )}
            </Box>
          ) : (
            <MarkdownRenderer
              content={message.content}
              variant="default"
              className={isOwnMessage ? 'markdown-renderer--own-message' : ''}
            />
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
    prevProps.unreadCount === nextProps.unreadCount &&
    prevProps.classNamePrefix === nextProps.classNamePrefix
  );
});
