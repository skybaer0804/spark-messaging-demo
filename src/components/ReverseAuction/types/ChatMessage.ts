export interface ChatMessage {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
    senderId?: string;
}
