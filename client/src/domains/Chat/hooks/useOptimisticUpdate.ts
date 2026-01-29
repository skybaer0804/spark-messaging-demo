import { useCallback } from 'preact/hooks';
import { signal } from '@preact/signals';
import { Message } from '../types';

export interface UseOptimisticUpdateReturn {
  messages: Message[];
  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
  sendOptimisticMessage: (roomId: string, content: string, senderId: string, senderName?: string, parentMessageId?: string) => string;
  updateMessageStatus: (tempId: string, updatedMessage: Partial<Message>) => void;
}

// v2.2.0: 메시지 리스트를 signal로 관리하여 리렌더링 최적화
export const messagesSignal = signal<Message[]>([]);

export function useOptimisticUpdate(): UseOptimisticUpdateReturn {
  const setMessages = useCallback((msgs: Message[] | ((prev: Message[]) => Message[])) => {
    if (typeof msgs === 'function') {
      messagesSignal.value = msgs(messagesSignal.value);
    } else {
      messagesSignal.value = msgs;
    }
  }, []);

  const sendOptimisticMessage = useCallback(
    (roomId: string, content: string, senderId: string, senderName?: string, parentMessageId?: string) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newMessage: Message = {
        _id: tempId,
        roomId,
        senderId,
        senderName,
        content,
        type: 'text',
        sequenceNumber: -1, // 임시값
        tempId,
        status: 'sending',
        readBy: [],
        timestamp: new Date(),
        parentMessageId, // 스레드 지원
      };

      // 부모 메시지가 있는 답글(스레드)인 경우 메인 메시지 목록에는 추가하지 않음
      // (단, 부모 메시지의 replyCount 등을 업데이트해야 한다면 여기서 처리 가능)
      if (!parentMessageId) {
        messagesSignal.value = [...messagesSignal.value, newMessage];
      } else {
        // 스레드 답글인 경우, 메인 목록에 있는 부모 메시지의 replyCount를 증가시키는 낙관적 업데이트 수행
        messagesSignal.value = messagesSignal.value.map(msg => 
          msg._id === parentMessageId 
            ? { ...msg, replyCount: (msg.replyCount || 0) + 1, lastReplyAt: new Date() } 
            : msg
        );
      }
      
      return tempId;
    },
    [],
  );

  const updateMessageStatus = useCallback((tempId: string, updatedMessage: Partial<Message>) => {
    messagesSignal.value = messagesSignal.value.map((msg) =>
      msg.tempId === tempId || msg._id === tempId ? { ...msg, ...updatedMessage } : msg
    );
  }, []);

  return {
    messages: messagesSignal.value,
    setMessages,
    sendOptimisticMessage,
    updateMessageStatus,
  };
}
