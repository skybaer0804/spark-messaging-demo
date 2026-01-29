import { useState, useEffect, useRef } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { chatApi } from '@/core/api/ApiService';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import type { Message, ChatUser } from '../types';
import { useChat } from '../context/ChatContext';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';

interface ThreadDetailProps {
  parentMessage: Message;
  currentUser: ChatUser | null;
  onClose?: () => void;
}

export const ThreadDetail = ({ parentMessage, currentUser }: ThreadDetailProps) => {
  const [replies, setReplies] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyInput, setReplyInput] = useState('');
  const { userList, currentRoom, isConnected, services } = useChat();
  const { chat: chatService } = services;
  const { sendOptimisticMessage } = useOptimisticUpdate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        setIsLoading(true);
        const response = await chatApi.getThreadMessages(parentMessage._id);
        setReplies(response.data);
      } catch (error) {
        console.error('Failed to fetch replies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplies();

    // 실시간 답글 수신 리스너
    const unsub = chatService.onRoomMessage((newMsg) => {
      const isReplyToCurrent = 
        newMsg.parentMessageId?.toString() === parentMessage._id?.toString();

      if (isReplyToCurrent) {
        setReplies(prev => {
          if (prev.some(m => m._id?.toString() === newMsg._id?.toString())) return prev;
          return [...prev, newMsg].sort((a, b) => (a.threadSequenceNumber || 0) - (b.threadSequenceNumber || 0));
        });
      }
    });

    return () => unsub();
  }, [parentMessage._id, chatService]); // parentMessage._id 의존성 추가로 스레드 전환 대응

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!replyInput.trim()) return;

    // parentMessageId가 확실히 존재하는지 확인
    const parentId = parentMessage._id.toString();
    const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id || 'unknown';

    // v2.5.0: 메인 메시지 목록의 replyCount 낙관적 업데이트 수행
    sendOptimisticMessage(
      parentMessage.roomId, 
      replyInput, 
      currentUserId, 
      currentUser?.username, 
      parentId
    );

    try {
      const response = await chatApi.sendMessage({
        roomId: parentMessage.roomId,
        content: replyInput,
        parentMessageId: parentId, // 문자열로 변환하여 확실히 전달
      });
      
      const newReply = {
        ...response.data,
        senderName: currentUser?.username || (currentUser as any)?.name || 'Unknown',
        timestamp: new Date(response.data.timestamp),
        status: 'sent'
      };
      setReplies(prev => [...prev, newReply]);
      setReplyInput('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  return (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Replies Area */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        {/* Parent Message */}
        <Box style={{ borderBottom: '1px solid var(--color-border-subtle)'}}>
          <ChatMessageItem message={parentMessage} currentUser={currentUser} hideToolbar={true} />
        </Box>

        {/* Replies List */}
        {isLoading ? (
          <Box padding="lg" style={{ textAlign: 'center' }}><Typography variant="body" color="text-secondary">불러오는 중...</Typography></Box>
        ) : replies.length === 0 ? (
          <Box padding="xl" style={{ textAlign: 'center' }}><Typography variant="body" color="text-tertiary">아직 답글이 없습니다.</Typography></Box>
        ) : (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {replies.map(reply => (
              <ChatMessageItem key={reply._id} message={reply} currentUser={currentUser} hideToolbar={true} />
            ))}
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Input Area */}
      <Box>
        <ChatInput
          input={replyInput}
          setInput={setReplyInput}
          members={userList}
          roomMembers={currentRoom?.members || []}
          selectedFiles={[]}
          isConnected={isConnected}
          placeholder="답글 쓰기..."
          onSendMessage={handleSendReply}
          onSendFile={() => {}}
          onFileSelect={() => {}}
          onFileRemove={() => {}}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendReply();
            }
          }}
          classNamePrefix="thread-detail"
        />
      </Box>
    </Box>
  );
};
