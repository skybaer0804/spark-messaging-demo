import type { ChatAdapter, ChatMessage } from '../components/types';
import type { useChatApp } from '../hooks/useChatApp';
import type { ChatRoom } from '../types';

export class ChatAppAdapter implements ChatAdapter {
  private chatAppHook: ReturnType<typeof useChatApp>;

  constructor(chatAppHook: ReturnType<typeof useChatApp>) {
    this.chatAppHook = chatAppHook;
  }

  getMessages(): ChatMessage[] {
    return this.chatAppHook.messages;
  }

  async sendMessage(content: string): Promise<void> {
    // useChatApp의 sendMessage는 내부 input을 사용하므로
    // 직접 메시지를 전송하도록 수정
    const chatService = (this.chatAppHook as any).chatServiceRef?.current;
    const roomService = (this.chatAppHook as any).roomServiceRef?.current;

    if (!content.trim() || !this.chatAppHook.isConnected || !chatService) return;

    const room = roomService?.getCurrentRoom();

    try {
      if (room) {
        await chatService.sendRoomMessage(room, 'text', content.trim());
      } else {
        await chatService.sendMessage('text', content.trim());
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendFile(file: File, _onProgress?: (progress: number) => void): Promise<void> {
    await this.chatAppHook.sendFile(file);
    // onProgress는 chatAppHook 내부에서 처리됨
  }

  isConnected(): boolean {
    return this.chatAppHook.isConnected;
  }

  getCurrentRoom(): string | null {
    return this.chatAppHook.currentRoom?.name || null;
  }

  getCurrentRoomMembers(): any[] {
    return this.chatAppHook.currentRoom?.members || [];
  }

  getWorkspaceUsers(): any[] {
    return this.chatAppHook.userList || [];
  }

  getUploadingFile(): File | null {
    return this.chatAppHook.uploadingFile;
  }

  getUploadProgress(): number {
    return this.chatAppHook.uploadProgress;
  }

  showRoomList(): boolean {
    return true;
  }

  showSidebar(): boolean {
    return true;
  }

  showFileUpload(): boolean {
    return true;
  }

  getPlaceholder(): string {
    const room = this.getCurrentRoom();
    return room ? `${room} Room에 메시지를 입력하세요...` : '메시지를 입력하세요...';
  }

  getEmptyMessage(): string {
    const room = this.getCurrentRoom();
    return room ? `${room} Room에 메시지가 없습니다. 메시지를 보내보세요!` : '메시지가 없습니다.';
  }

  async onRoomSelect(roomId: string): Promise<void> {
    // roomId로 ChatRoom 찾기
    const room = this.chatAppHook.roomList?.find((r: ChatRoom) => r._id === roomId || r.name === roomId);
    if (room) {
      await this.chatAppHook.handleRoomSelect(room);
    }
  }

  async onRoomCreate(): Promise<void> {
    await this.chatAppHook.handleCreateRoom();
  }

  async onRoomLeave(): Promise<void> {
    await this.chatAppHook.leaveRoom();
  }

  isDebugMode(): boolean {
    return (this.chatAppHook as any).debugEnabled;
  }

  toggleDebug(): void {
    (this.chatAppHook as any).toggleDebug();
  }
}
