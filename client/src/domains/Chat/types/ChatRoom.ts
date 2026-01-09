import { Message } from './Message';

export interface ChatUser {
  _id: string;
  username: string;
  avatar?: string;
  status?: 'online' | 'offline';
  role?: string;
}

export interface ChatRoom {
  _id: string;
  name: string;
  members: ChatUser[];
  isGroup: boolean;
  lastMessage?: Message;
  roomType: 'DEFAULT' | 'VIDEO_MEETING';
  createdAt: string;
  updatedAt: string;
}

export interface UserChatRoom {
  userId: string;
  roomId: string;
  unreadCount: number;
  lastReadMessageId?: string;
  isPinned: boolean;
  notificationEnabled: boolean;
  createdAt: string;
}
