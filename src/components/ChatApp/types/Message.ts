export interface Message {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
    room?: string;
}
