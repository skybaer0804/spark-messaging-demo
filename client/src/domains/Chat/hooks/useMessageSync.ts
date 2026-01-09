import { useRef, useCallback } from 'preact/hooks';
import { Message } from '../types';
import { useChat } from '../context/ChatContext';

export function useMessageSync() {
  const lastSequenceRef = useRef<number>(0);
  const { services } = useChat();
  const { chat: chatService } = services;

  const syncMessages = useCallback(async (roomId: string, currentMessages: Message[]) => {
    if (currentMessages.length > 0) {
      const maxSeq = Math.max(...currentMessages.map((m) => m.sequenceNumber).filter((s) => s >= 0));
      lastSequenceRef.current = maxSeq;
    }

    try {
      const response = await chatService.syncMessages(roomId, lastSequenceRef.current);
      const newMessages: Message[] = response.messages;

      if (newMessages.length === 0) return currentMessages;

      // 누락 메시지 병합 및 시퀀스 순 정렬
      const combined = [...currentMessages, ...newMessages];
      const sorted = combined.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

      // 중복 제거 (sequenceNumber 기준)
      return Array.from(new Map(sorted.map((m) => [m.sequenceNumber, m])).values());
    } catch (error) {
      console.error('Failed to sync messages:', error);
      return currentMessages;
    }
  }, []);

  return { syncMessages };
}
