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

  // 서버에서 내려온 Message(document)를 프론트 Message 타입으로 변환
  const formatServerMessage = useCallback((msg: any): Message => {
    const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;

    let fileData: any = undefined;
    if (msg.fileUrl || msg.thumbnailUrl || msg.renderUrl) {
      fileData = {
        fileName: msg.fileName || 'unknown',
        fileType: msg.type || 'file',
        mimeType: msg.mimeType || 'application/octet-stream',
        size: msg.fileSize || 0,
        url: msg.fileUrl,
        thumbnail: msg.thumbnailUrl,
        renderUrl: msg.renderUrl, // 추가: 3D 렌더링용 GLB URL
        data: msg.thumbnailUrl || msg.renderUrl || msg.fileUrl, // 프리뷰 데이터 우선순위
      };
    }

    return {
      ...msg,
      senderId: senderObj ? senderObj._id : msg.senderId,
      senderName: msg.senderName || (senderObj ? senderObj.username : 'Unknown'),
      timestamp: new Date(msg.timestamp),
      status: msg.status || 'sent',
      fileData,
    };
  }, []);

  const handleRoomSelect = useCallback(
    async (room: ChatRoom) => {
      try {
        await roomService.joinRoom(room._id);
        const history = await chatService.getMessages(room._id);

        // v2.2.0: 서버 데이터 모델에 맞춰 포맷팅 (Populate된 senderId 처리)
        const formatted = history.map((msg: any) => formatServerMessage(msg));

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

  // 실시간 메시지 수신 및 업데이트 통합 리스너
  useEffect(() => {
    const unsub = chatService.onRoomMessage((newMsg) => {
      // v2.2.0: 내가 현재 이 방을 보고 있다면 즉시 읽음 처리 요청
      if (currentRoom && newMsg.roomId === currentRoom._id) {
        chatService.markAsRead(currentRoom._id);
      }

      const type = newMsg.type as string;

      // 1. 메시지 업데이트 또는 진행률 이벤트인 경우
      if (type === 'MESSAGE_UPDATED' || type === 'message-updated' || 
          type === 'MESSAGE_PROGRESS' || type === 'message-progress') {
        
        // 완료 이벤트는 서버 최종본으로 단건 재조회하여 DB 상태와 완전히 동기화
        if (type === 'MESSAGE_UPDATED' || type === 'message-updated') {
          const messageId = newMsg._id?.toString();
          if (messageId) {
            chatService.getMessageById(messageId).then((serverMsg: any) => {
              const formattedMsg = formatServerMessage(serverMsg);
              setMessages((prev: Message[]) =>
                prev.map((m: Message) => (m._id.toString() === messageId ? { ...m, ...formattedMsg } : m)),
              );
            }).catch((e) => {
              console.error('❌ [Hook] 메시지 단건 재조회 실패:', e);
            });
          }
          return;
        }
        
        setMessages((prev: Message[]) => {
          return prev.map((m: Message) => {
            const isMatch = m._id.toString() === newMsg._id.toString() || 
                           (newMsg.tempId && m.tempId === newMsg.tempId);
            
            if (isMatch) {
              // v2.4.0: 타입 오염 방지 - 기존 메시지(m)를 기반으로 필요한 필드만 신규 메시지(newMsg)에서 가져옴
              // 서버에서 온 데이터(newMsg)는 최상위에 필드들이 있을 수 있음
              const updatedFileData = {
                ...m.fileData,
                ...(newMsg.fileData || {}),
                thumbnail: (newMsg as any).thumbnailUrl || newMsg.fileData?.thumbnail || m.fileData?.thumbnail,
                renderUrl: (newMsg as any).renderUrl || newMsg.fileData?.renderUrl || m.fileData?.renderUrl,
                url: (newMsg as any).fileUrl || newMsg.fileData?.url || m.fileData?.url
              } as any;

              return {
                ...m,
                ...newMsg, // 전체 필드 업데이트 허용 (status 등)
                fileData: updatedFileData,
                renderUrl: newMsg.renderUrl || m.renderUrl,
                status: newMsg.status || m.status,
                readBy: (newMsg.readBy && newMsg.readBy.length > 0) ? newMsg.readBy : m.readBy,
              };
            }
            return m;
          });
        });
        return;
      }

      // 2. 신규 메시지 추가 또는 기존 메시지 업데이트
      setMessages((prev: Message[]) => {
        // tempId로 중복 체크 (낙관적 업데이트된 메시지)
        if (newMsg.tempId && prev.some((m: Message) => m.tempId === newMsg.tempId)) {
          // 기존 낙관적 메시지를 실제 서버 데이터로 교체
          return prev.map((m: Message) => 
            m.tempId === newMsg.tempId ? { ...m, ...newMsg, status: 'sent' } : m
          );
        }
        
        // _id로 중복 체크 (서버에서 온 메시지)
        if (newMsg._id && prev.some((m: Message) => m._id === newMsg._id)) {
          return prev.map((m: Message) => {
            if (m._id === newMsg._id) {
              return {
                ...m,
                ...newMsg,
                fileData: newMsg.fileData || m.fileData,
              };
            }
            return m;
          });
        }
        
        // sequenceNumber로도 중복 체크
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
  }, [chatService, setMessages, currentRoom?._id, formatServerMessage]);

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
