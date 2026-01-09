import { useState, useCallback, useEffect } from 'preact/hooks';
import type { ChatRoom, Message } from '../types';
import { useChat } from '../context/ChatContext';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { useMessageSync } from './useMessageSync';
import { useAuth } from '@/core/hooks/useAuth';

export function useChatRoom() {
  const { user } = useAuth();
  const { services, isConnected } = useChat();
  const { chat: chatService, room: roomService } = services;

  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const { messages, setMessages, sendOptimisticMessage, updateMessageStatus } = useOptimisticUpdate();
  const { syncMessages } = useMessageSync();

  const handleRoomSelect = useCallback(
    async (room: ChatRoom) => {
      try {
        await roomService.joinRoom(room._id);
        const history = await chatService.getMessages(room._id);

        // v2.2.0: 서버 데이터 모델에 맞춰 포맷팅
        const formatted = history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          status: 'sent',
        }));

        setMessages(formatted);
        setCurrentRoom(room);
        await chatService.setCurrentRoom(room._id);
      } catch (error) {
        console.error('Failed to select room:', error);
      }
    },
    [chatService, roomService, setMessages],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentRoom || !user || !content.trim()) return;

      const tempId = sendOptimisticMessage(currentRoom._id, content, user.id, user.username);

      try {
        const response = await chatService.sendMessage(currentRoom._id, content, 'text', tempId);
        updateMessageStatus(tempId, {
          _id: response._id,
          sequenceNumber: response.sequenceNumber,
          status: 'sent',
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        updateMessageStatus(tempId, { status: 'failed' });
      }
    },
    [currentRoom, user, sendOptimisticMessage, chatService, updateMessageStatus],
  );

  // 네트워크 재연결 시 자동 동기화
  useEffect(() => {
    if (isConnected && currentRoom) {
      syncMessages(currentRoom._id, messages).then((updated) => {
        setMessages(updated);
      });
    }
  }, [isConnected, currentRoom]);

  // 실시간 메시지 수신 리스너
  useEffect(() => {
    const unsub = chatService.onRoomMessage((newMsg) => {
      // 내가 보낸 메시지(tempId 매칭)면 무시 (이미 낙관적 업데이트됨)
      setMessages((prev: Message[]) => {
        if (newMsg.tempId && prev.some((m: Message) => m.tempId === newMsg.tempId)) {
          return prev;
        }
        return [...prev, newMsg].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      });
    });
    return unsub;
  }, [chatService, setMessages]);

  return {
    currentRoom,
    messages,
    sendMessage,
    handleRoomSelect,
    setCurrentRoom,
    setMessages,
  };
}
