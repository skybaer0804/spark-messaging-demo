export interface FileData {
  fileName: string;
  fileType: 'image' | 'document' | 'video' | 'audio';
  mimeType: string;
  size: number;
  data: string; // Base64
  thumbnail?: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received';
  room?: string;
  senderId?: string;
  fileData?: FileData;
}
