import type { ChatAdapter, ChatMessage } from '../../Chat/types';
import type { useVideoMeeting } from '../hooks/useVideoMeeting';

export class VideoMeetingAdapter implements ChatAdapter {
  private videoMeetingHook: ReturnType<typeof useVideoMeeting>;

  constructor(videoMeetingHook: ReturnType<typeof useVideoMeeting>) {
    this.videoMeetingHook = videoMeetingHook;
  }

  getMessages(): ChatMessage[] {
    // VideoMeeting의 ChatMessage를 ChatMessage로 변환
    return this.reverseAuctionHook.chatMessages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      type: msg.type,
      senderId: msg.senderId,
      // VideoMeeting은 fileData 없음
    }));
  }

  async sendMessage(content: string): Promise<void> {
    // useVideoMeeting의 handleSendChat은 내부 chatInput을 사용
    // 직접 메시지를 전송하도록 수정
    const chatService = (this.reverseAuctionHook as any).chatServiceRef?.current;
    const currentRoom = this.reverseAuctionHook.currentRoom;

    if (!content.trim() || !this.reverseAuctionHook.isConnected || !chatService || !currentRoom) return;

    try {
      await chatService.sendRoomMessage(currentRoom.roomId, 'text', content.trim());
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendFile(file: File, onProgress?: (progress: number) => void): Promise<void> {
    const fileTransferService = (this.reverseAuctionHook as any).fileTransferServiceRef?.current;
    const currentRoom = this.reverseAuctionHook.currentRoom;

    if (!fileTransferService || !currentRoom) {
      throw new Error('File transfer service or room not available');
    }

    try {
      await fileTransferService.sendFile(currentRoom.roomId, file, onProgress);
    } catch (error) {
      console.error('Failed to send file:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.reverseAuctionHook.isConnected;
  }

  getCurrentRoom(): string | null {
    return this.reverseAuctionHook.currentRoom?.roomId || null;
  }

  getUploadingFile(): File | null {
    return (this.reverseAuctionHook as any).uploadingFile || null;
  }

  getUploadProgress(): number {
    return (this.reverseAuctionHook as any).uploadProgress || 0;
  }

  showRoomList(): boolean {
    return false; // VideoMeeting은 룸 목록 UI 없음
  }

  showSidebar(): boolean {
    return false; // VideoMeeting은 사이드바 없음
  }

  showFileUpload(): boolean {
    return true; // VideoMeeting도 파일 전송 지원
  }

  getPlaceholder(): string {
    return '메시지를 입력하세요...';
  }

  getEmptyMessage(): string {
    return '메시지가 없습니다.';
  }

  // VideoMeeting은 룸 관리를 외부에서 하므로 이벤트 핸들러 없음
}
