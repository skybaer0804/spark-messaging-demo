export type UserRole = 'demander' | 'supplier' | 'admin';

export type Category = '회의' | '웨비나' | '상담';

export interface Participant {
  socketId: string;
  name: string;
  role: UserRole;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
}

export interface Room {
  id: string;
  title: string;
  category: Category;
  hostId: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'system' | 'file-transfer';
  fileData?: any;
}
