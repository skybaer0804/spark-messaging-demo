import { useRef, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { ChatMessageItem } from './ChatMessageItem';
import { DateDivider } from './DateDivider/DateDivider';
import { groupMessagesByDate } from '../utils/chatUtils';
import type { Message, ChatRoom, ChatUser } from '../types';
import './Chat.scss';

interface ChatMessagesProps {
  messages: Message[];
  currentUser?: ChatUser | null;
  currentRoom?: ChatRoom;
  messagesRef?: any;
  messagesEndRef?: any;
  onImageClick?: (url: string, fileName: string) => void;
  emptyMessage?: string;
  classNamePrefix?: string;
}

function ChatMessagesComponent({
  messages,
  currentUser,
  currentRoom,
  messagesRef: externalMessagesRef,
  messagesEndRef: externalMessagesEndRef,
  onImageClick,
  emptyMessage,
  classNamePrefix = 'chat',
}: ChatMessagesProps) {
  const internalMessagesRef = useRef<HTMLDivElement>(null);
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const baseClass = classNamePrefix;

  // refs가 외부에서 제공되면 사용, 없으면 내부 ref 사용
  const messagesRef = externalMessagesRef || internalMessagesRef;
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;

  // 자체 스크롤 관리 (외부 ref가 없을 때만)
  useEffect(() => {
    if (!externalMessagesRef && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages.length, externalMessagesRef]);

  // 스타일 결정: ChatApp 스타일 vs Chat 스타일
  const isChatAppStyle = externalMessagesRef !== undefined;
  const containerStyle = isChatAppStyle
    ? {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
      }
    : {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: 'var(--space-padding-card-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-gap-sm)',
      };

  return (
    <Box
      className={isChatAppStyle ? undefined : `${baseClass}__messages-list`}
      style={containerStyle}
      ref={messagesRef}
    >
      {messages.length === 0 ? (
        <Box style={{ textAlign: 'center', padding: 'var(--space-padding-card-lg)' }}>
          <Typography variant="body-small" color="text-tertiary">
            {emptyMessage || '메시지가 없습니다.'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing="md" style={{ flex: 1, minHeight: 0 }}>
          {groupMessagesByDate(messages).map((item, index) => {
            if (item.type === 'divider') {
              return (
                <DateDivider
                  key={`divider-${item.date?.getTime() || index}`}
                  date={item.date!}
                  classNamePrefix={classNamePrefix}
                />
              );
            }

            // 안읽음 카운트 계산 (currentRoom이 있을 때만)
            let unreadCount: number | undefined = undefined;
            if (currentRoom && item.message) {
              const totalMembers = currentRoom.members?.length || 0;
              const readCount = item.message.readBy?.length || 0;
              unreadCount = totalMembers - readCount;
            }

            return (
              <ChatMessageItem
                key={item.message?._id || `temp-${index}`}
                message={item.message!}
                currentUser={currentUser}
                onImageClick={onImageClick}
                unreadCount={unreadCount && unreadCount > 0 ? unreadCount : undefined}
                classNamePrefix={classNamePrefix}
              />
            );
          })}
          {/* v2.2.0: 하단 앵커 요소 (외부 ref가 있을 때만) */}
          {externalMessagesEndRef && <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />}
        </Stack>
      )}
    </Box>
  );
}

// memo로 메모이제이션하여 messages 배열 참조가 변경되지 않으면 리렌더링 방지
export const ChatMessages = memo(ChatMessagesComponent, (prevProps, nextProps) => {
  // messages 배열 길이와 내용이 같으면 리렌더링하지 않음
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  // 메시지 ID 비교로 변경 감지
  const prevIds = prevProps.messages.map((m) => m._id).join(',');
  const nextIds = nextProps.messages.map((m) => m._id).join(',');
  return (
    prevIds === nextIds &&
    prevProps.classNamePrefix === nextProps.classNamePrefix &&
    prevProps.currentUser === nextProps.currentUser
  );
});
