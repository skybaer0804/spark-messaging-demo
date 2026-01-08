export interface ChatRoom {
  _id: string;
  name: string;
  members: any[];
  isGroup: boolean;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}
