import type { Signal } from '@preact/signals';
import type { Message, FileData } from '../../types';

export type { Message, FileData };
export type ChatMessage = Message;

// ChatAdapter 인터페이스
export interface ChatAdapter {
  // 메시지 관련
  getMessages(): ChatMessage[];
  sendMessage(content: string): Promise<void>;
  sendFile?(file: File, onProgress?: (progress: number) => void): Promise<void>;

  // 상태 관리
  isConnected(): boolean;
  getCurrentRoom(): string | null;

  // 입력 상태 관리 (선택적)
  getInput?(): string;
  setInput?(value: string): void;
  getInputSignal?(): Signal<string>;

  // 파일 전송 상태 (선택적)
  getUploadingFile?(): File | null;
  getUploadProgress?(): number;

  // UI 커스터마이징
  showRoomList?(): boolean;
  showSidebar?(): boolean;
  showFileUpload?(): boolean;
  getPlaceholder?(): string;
  getEmptyMessage?(): string;

  // 이벤트 핸들러 (선택적)
  onRoomSelect?(roomId: string): void | Promise<void>;
  onRoomCreate?(): void | Promise<void>;
  onRoomLeave?(): void | Promise<void>;

  // 디버그 모드 관련
  isDebugMode?(): boolean;
  toggleDebug?(): void;
}

// ChatConfig 인터페이스 (UI 설정)
export interface ChatConfig {
  // 스타일 클래스 프리픽스
  classNamePrefix?: string;
  // 기본 클래스명
  baseClassName?: string;
  // 사이드바 표시 여부
  showSidebar?: boolean;
  // 파일 업로드 표시 여부
  showFileUpload?: boolean;
  // 이미지 모달 표시 여부
  showImageModal?: boolean;
  // 플레이스홀더 텍스트
  placeholder?: string;
  // 빈 메시지 텍스트
  emptyMessage?: string;
}
