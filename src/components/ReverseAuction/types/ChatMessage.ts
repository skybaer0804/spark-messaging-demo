export interface FileData {
  fileName: string;
  fileType: 'image' | 'document' | 'video' | 'audio';
  mimeType: string;
  size: number;
  data: string; // Base64
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received';
  senderId?: string;
  fileData?: FileData;
}
