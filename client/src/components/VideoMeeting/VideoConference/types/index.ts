import type { Participant } from '../../types';
import type { Signal } from '@preact/signals';

export interface VideoConferenceAdapter {
  getLocalStream(): MediaStream | null;
  isVideoEnabled(): boolean;
  getParticipants(): Participant[];
  getSocketId(): string | null;
  startLocalStream(): Promise<void>;
  stopLocalStream(): Promise<void>;
  setVideoRef(socketId: string, element: HTMLVideoElement | null): void;

  // Signal 기반 접근 (선택적, 폴링 제거를 위해 추가)
  getLocalStreamSignal?(): Signal<MediaStream | null>;
  getIsVideoEnabledSignal?(): Signal<boolean>;
  getParticipantsSignal?(): Signal<Participant[]>;
  getSocketIdSignal?(): Signal<string | null>;
}
