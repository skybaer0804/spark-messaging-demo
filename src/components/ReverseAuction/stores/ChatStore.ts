import { signal, type Signal } from '@preact/signals';
import type { ChatMessage } from '../types';

export class ChatStore {
  // 채팅 메시지
  public readonly messages: Signal<ChatMessage[]> = signal([]);

  // 입력 상태
  public readonly input: Signal<string> = signal('');

  // 파일 업로드 상태
  public readonly uploadingFile: Signal<File | null> = signal(null);
  public readonly uploadProgress: Signal<number> = signal(0);

  // 메시지 추가
  public addMessage(message: ChatMessage): void {
    this.messages.value = [...this.messages.value, message];
  }

  // 메시지 초기화
  public clearMessages(): void {
    this.messages.value = [];
  }

  // 입력 상태 업데이트
  public setInput(value: string): void {
    this.input.value = value;
  }

  // 파일 업로드 상태 업데이트
  public setUploadingFile(file: File | null): void {
    this.uploadingFile.value = file;
  }

  public setUploadProgress(progress: number): void {
    this.uploadProgress.value = progress;
  }

  // 정리
  public reset(): void {
    this.messages.value = [];
    this.input.value = '';
    this.uploadingFile.value = null;
    this.uploadProgress.value = 0;
  }
}
