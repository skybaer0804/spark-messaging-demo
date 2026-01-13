export type MessageType = 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface FileData {
  fileName: string;
  fileType: MessageType;
  mimeType: string;
  size: number;
  url?: string;
  thumbnail?: string;
  data?: string; // Base64 (for sending)
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  type: MessageType;
  sequenceNumber: number;
  tempId?: string;
  status?: MessageStatus;
  readBy: string[];
  timestamp: Date;
  fileData?: FileData;
  isDeleted?: boolean;
  deletedBy?: 'sender' | 'all';
}
