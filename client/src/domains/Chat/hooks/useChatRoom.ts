import { useCallback, useEffect } from 'preact/hooks';
import type { ChatRoom, Message } from '../types';
import { useChat } from '../context/ChatContext';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { useMessageSync } from './useMessageSync';
import { useAuth } from '@/core/hooks/useAuth';
import { chatRoomList } from '@/stores/chatRoomsStore';

export function useChatRoom() {
  const { user } = useAuth();
  const { services, isConnected, currentRoom, setCurrentRoom } = useChat();
  const { chat: chatService, room: roomService } = services;

  const { messages, setMessages, sendOptimisticMessage, updateMessageStatus } = useOptimisticUpdate();
  const { syncMessages } = useMessageSync();

  const handleRoomSelect = useCallback(
    async (room: ChatRoom) => {
      try {
        await roomService.joinRoom(room._id);
        const history = await chatService.getMessages(room._id);

        // v2.2.0: 서버 데이터 모델에 맞춰 포맷팅 (Populate된 senderId 처리)
        const formatted = history.map((msg: any) => {
          const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;
          
          // 파일 데이터 변환 (fileUrl, thumbnailUrl → fileData)
          let fileData: any = undefined;
          if (msg.fileUrl || msg.thumbnailUrl) {
            fileData = {
              fileName: msg.fileName || 'unknown',
              fileType: msg.type || 'file',
              mimeType: msg.mimeType || 'application/octet-stream',
              size: msg.fileSize || 0,
              url: msg.fileUrl, // 원본 파일 URL
              thumbnail: msg.thumbnailUrl, // 썸네일 URL (이미지인 경우)
              data: msg.thumbnailUrl || msg.fileUrl, // 표시용 (썸네일 우선, 없으면 원본)
            };
          }
          
          return {
            ...msg,
            senderId: senderObj ? senderObj._id : msg.senderId,
            senderName: msg.senderName || (senderObj ? senderObj.username : 'Unknown'),
            timestamp: new Date(msg.timestamp),
            status: 'sent',
            fileData, // 파일 데이터 추가
          };
        });

        setMessages(formatted);
        setCurrentRoom(room);
        await chatService.setCurrentRoom(room._id);
        
        // v2.2.0: 방 선택 시 해당 방의 안읽음 카운트 로컬에서 초기화
        chatRoomList.value = chatRoomList.value.map((r: any) => 
          r._id === room._id ? { ...r, unreadCount: 0 } : r
        );
      } catch (error) {
        console.error('Failed to select room:', error);
      }
    },
    [chatService, roomService, setMessages],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentRoom || !user || !content.trim()) return;

      const currentUserId = user.id || (user as any)._id;
      const tempId = sendOptimisticMessage(currentRoom._id, content, currentUserId, user.username);

      try {
        const response = await chatService.sendMessage(currentRoom._id, content, 'text', tempId);
        updateMessageStatus(tempId, {
          _id: response._id,
          sequenceNumber: response.sequenceNumber,
          status: 'sent',
        });
        
        // v2.3.0: 보낸 메시지에 대한 내 방 목록 업데이트는 
        // 서버에서 오는 ROOM_LIST_UPDATED 소켓 이벤트를 통해 처리함 (Server-Side Authority)
        // 기존의 수동 chatRoomList.value 업데이트 로직 제거
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
      // v2.2.0: 내가 현재 이 방을 보고 있다면 즉시 읽음 처리 요청
      if (currentRoom && newMsg.roomId === currentRoom._id) {
        chatService.markAsRead(currentRoom._id);
      }

      // 중복 메시지 방지: tempId 또는 _id로 중복 체크
      setMessages((prev: Message[]) => {
        // tempId로 중복 체크 (낙관적 업데이트된 메시지)
        if (newMsg.tempId && prev.some((m: Message) => m.tempId === newMsg.tempId)) {
          return prev;
        }
        
        // _id로 중복 체크 (서버에서 온 메시지)
        if (newMsg._id && prev.some((m: Message) => m._id === newMsg._id)) {
          return prev;
        }
        
        // sequenceNumber로도 중복 체크 (추가 안전장치)
        if (newMsg.sequenceNumber && prev.some((m: Message) => 
          m.sequenceNumber === newMsg.sequenceNumber && 
          m.roomId === newMsg.roomId
        )) {
          return prev;
        }
        
        return [...prev, newMsg].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      });
    });
    return unsub;
  }, [chatService, setMessages, currentRoom]);

  // v2.4.0: 방 전환 또는 컴포넌트 언마운트 시 서버의 Active Room 상태 해제
  useEffect(() => {
    return () => {
      if (currentRoom) {
        chatService.setCurrentRoom(null);
      }
    };
  }, [currentRoom?._id, chatService]);

  return {
    currentRoom,
    messages,
    sendMessage,
    handleRoomSelect,
    setCurrentRoom,
    setMessages,
  };
}
