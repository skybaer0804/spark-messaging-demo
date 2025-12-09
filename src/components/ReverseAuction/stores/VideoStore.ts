import { signal, type Signal } from '@preact/signals';

export class VideoStore {
  // 로컬 스트림
  public readonly localStream: Signal<MediaStream | null> = signal(null);

  // 영상 활성화 상태
  public readonly isVideoEnabled: Signal<boolean> = signal(false);

  // 로컬 스트림 설정
  public setLocalStream(stream: MediaStream | null): void {
    this.localStream.value = stream;
    this.isVideoEnabled.value = stream !== null;
  }

  // 영상 활성화 상태 업데이트
  public setIsVideoEnabled(enabled: boolean): void {
    this.isVideoEnabled.value = enabled;
    if (!enabled) {
      // 영상 비활성화 시 스트림 정리
      if (this.localStream.value) {
        this.localStream.value.getTracks().forEach((track) => track.stop());
        this.localStream.value = null;
      }
    }
  }

  // 정리
  public reset(): void {
    if (this.localStream.value) {
      this.localStream.value.getTracks().forEach((track) => track.stop());
    }
    this.localStream.value = null;
    this.isVideoEnabled.value = false;
  }
}
