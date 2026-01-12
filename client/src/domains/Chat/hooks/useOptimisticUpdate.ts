import { useCallback } from 'preact/hooks';
import { signal } from '@preact/signals';
import { Message } from '../types';

export interface UseOptimisticUpdateReturn {
  messages: Message[];
  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
  sendOptimisticMessage: (roomId: string, content: string, senderId: string, senderName?: string) => string;
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
    (roomId: string, content: string, senderId: string, senderName?: string) => {
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
      };

      messagesSignal.value = [...messagesSignal.value, newMessage];
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
