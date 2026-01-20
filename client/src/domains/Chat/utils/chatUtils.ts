import { ChatRoom, Message } from '../types';
import { isSameDate } from '@/core/utils/messageUtils';

export const getDirectChatName = (room: ChatRoom, currentUserId?: string) => {
  if (room.type !== 'direct') return room.name || 'Unnamed Room';
  const otherMember = room.members.find((m) => {
    const memberId = typeof m === 'string' ? m : m._id;
    return memberId.toString() !== currentUserId?.toString();
  });
  return otherMember ? (typeof otherMember === 'string' ? 'User' : otherMember.username) : 'Unknown';
};

export interface MessageWithDateDivider {
  type: 'message' | 'divider';
  message?: Message;
  date?: Date;
}

/**
 * 메시지 배열을 날짜별로 그룹화하고 날짜 구분선을 삽입합니다.
 * @param messages 메시지 배열
 * @returns 메시지와 날짜 구분선이 포함된 배열
 */
export function groupMessagesByDate(messages: Message[]): MessageWithDateDivider[] {
  if (messages.length === 0) return [];

  const result: MessageWithDateDivider[] = [];
  let lastDate: Date | null = null;

  for (const message of messages) {
    const messageDate = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);

    // 날짜가 변경되었으면 구분선 추가
    if (!lastDate || !isSameDate(messageDate, lastDate)) {
      result.push({
        type: 'divider',
        date: messageDate,
      });
      lastDate = messageDate;
    }

    result.push({
      type: 'message',
      message,
    });
  }

  return result;
}
