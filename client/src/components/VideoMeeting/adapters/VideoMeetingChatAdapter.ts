import type { ChatAdapter, ChatMessage } from '../../Chat/types';
import type { ChatStore } from '../stores/ChatStore';
import type { VideoMeetingStore } from '../stores/VideoMeetingStore';
import { ChatService } from '../../../services/ChatService';
import { FileTransferService } from '../../../services/FileTransferService';
import type { Signal } from '@preact/signals';

export class VideoMeetingChatAdapter implements ChatAdapter {
  private chatStore: ChatStore;
  private videoMeetingStore: VideoMeetingStore;
  private chatService: ChatService;
  private fileTransferService: FileTransferService | null;

  constructor(
    chatStore: ChatStore,
    videoMeetingStore: VideoMeetingStore,
    chatService: ChatService,
    fileTransferService: FileTransferService | null = null,
  ) {
    this.chatStore = chatStore;
    this.videoMeetingStore = videoMeetingStore;
    this.chatService = chatService;
    this.fileTransferService = fileTransferService;
  }

  // 메시지 관련
  getMessages(): ChatMessage[] {
    // ChatStore의 메시지를 Chat 컴포넌트의 ChatMessage 타입으로 변환
    return this.chatStore.messages.value.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      type: msg.type,
      senderId: msg.senderId,
      fileData: msg.fileData,
    }));
  }

  // Signal 기반 접근 (반응형 업데이트)
  getMessagesSignal(): Signal<ChatMessage[]> {
    return this.chatStore.messages as Signal<ChatMessage[]>;
  }

  async sendMessage(content: string): Promise<void> {
    const currentRoom = this.videoMeetingStore.currentRoom.value;
    if (!content.trim() || !currentRoom || !this.videoMeetingStore.isConnected.value) {
      console.warn('[DEBUG] 메시지 전송 실패:', {
        content: content.trim(),
        currentRoom,
        isConnected: this.reverseAuctionStore.isConnected.value,
      });
      return;
    }

    try {
      console.log('[DEBUG] 메시지 전송 시작:', { roomId: currentRoom.roomId, content: content.trim() });
      await this.chatService.sendRoomMessage(currentRoom.roomId, 'text', content.trim());
      console.log('[DEBUG] 메시지 전송 완료');
      this.chatStore.setInput('');
    } catch (error) {
      console.error('[ERROR] 메시지 전송 실패:', error);
      throw error;
    }
  }

  // 입력 상태 관리
  getInput(): string {
    return this.chatStore.input.value;
  }

  setInput(value: string): void {
    this.chatStore.setInput(value);
  }

  // Signal 기반 입력 상태 (반응형 업데이트)
  getInputSignal(): Signal<string> {
    return this.chatStore.input;
  }

  async sendFile(file: File, onProgress?: (progress: number) => void): Promise<void> {
    const currentRoom = this.videoMeetingStore.currentRoom.value;
    if (!this.videoMeetingStore.isConnected.value || !this.fileTransferService || !currentRoom) {
      throw new Error('파일 전송을 할 수 없습니다.');
    }

    this.chatStore.setUploadingFile(file);
    this.chatStore.setUploadProgress(0);

    try {
      await this.fileTransferService.sendFile(currentRoom.roomId, file, (progress) => {
        this.chatStore.setUploadProgress(progress);
        if (onProgress) {
          onProgress(progress);
        }
      });
      this.chatStore.setUploadingFile(null);
      this.chatStore.setUploadProgress(0);
    } catch (error) {
      console.error('Failed to send file:', error);
      this.chatStore.setUploadingFile(null);
      this.chatStore.setUploadProgress(0);
      if (error instanceof Error) {
        throw new Error(`파일 전송 실패: ${error.message}`);
      } else {
        throw new Error('파일 전송 실패');
      }
    }
  }

  // 상태 관리
  isConnected(): boolean {
    return this.videoMeetingStore.isConnected.value;
  }

  getCurrentRoom(): string | null {
    return this.videoMeetingStore.currentRoom.value?.roomId || null;
  }

  // 파일 전송 상태
  getUploadingFile(): File | null {
    return this.chatStore.uploadingFile.value;
  }

  getUploadProgress(): number {
    return this.chatStore.uploadProgress.value;
  }

  // UI 커스터마이징
  showFileUpload(): boolean {
    return true; // VideoMeeting에서는 항상 파일 업로드 가능
  }

  getPlaceholder(): string {
    return '메시지를 입력하세요...';
  }

  getEmptyMessage(): string {
    return '메시지가 없습니다.';
  }

  // 디버그 모드 관련
  isDebugMode(): boolean {
    return localStorage.getItem('chat_debug_mode') === 'true';
  }

  toggleDebug(): void {
    const nextValue = !this.isDebugMode();
    this.chatService.setDebugMode(nextValue);
  }
}
