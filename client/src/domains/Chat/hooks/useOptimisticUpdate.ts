import { useState, useCallback } from 'preact/hooks';
import { Message } from '../types';

export interface UseOptimisticUpdateReturn {
  messages: Message[];
  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
  sendOptimisticMessage: (roomId: string, content: string, senderId: string, senderName?: string) => string;
  updateMessageStatus: (tempId: string, updatedMessage: Partial<Message>) => void;
}

export function useOptimisticUpdate(): UseOptimisticUpdateReturn {
  const [messages, setMessages] = useState<Message[]>([]);

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

      setMessages((prev) => [...prev, newMessage]);
      return tempId;
    },
    [],
  );

  const updateMessageStatus = useCallback((tempId: string, updatedMessage: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.tempId === tempId || msg._id === tempId ? { ...msg, ...updatedMessage } : msg)),
    );
  }, []);

  return {
    messages,
    setMessages,
    sendOptimisticMessage,
    updateMessageStatus,
  };
}
