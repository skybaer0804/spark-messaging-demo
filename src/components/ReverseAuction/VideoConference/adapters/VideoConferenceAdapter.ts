import type { VideoConferenceAdapter } from '../types';
import type { Participant } from '../../types';
import type { VideoStore } from '../../stores/VideoStore';
import type { ReverseAuctionStore } from '../../stores/ReverseAuctionStore';
import type { WebRTCService } from '../../services/WebRTCService';
import type { Signal } from '@preact/signals';

export class ReverseAuctionVideoConferenceAdapter implements VideoConferenceAdapter {
  private videoStore: VideoStore;
  private reverseAuctionStore: ReverseAuctionStore;
  private webRTCService: WebRTCService | null;

  constructor(
    videoStore: VideoStore,
    reverseAuctionStore: ReverseAuctionStore,
    webRTCService: WebRTCService | null = null,
  ) {
    this.videoStore = videoStore;
    this.reverseAuctionStore = reverseAuctionStore;
    this.webRTCService = webRTCService;
  }

  // WebRTCService 설정 (나중에 설정 가능)
  public setWebRTCService(webRTCService: WebRTCService): void {
    this.webRTCService = webRTCService;
  }

  getLocalStream(): MediaStream | null {
    return this.videoStore.localStream.value;
  }

  isVideoEnabled(): boolean {
    return this.videoStore.isVideoEnabled.value;
  }

  getParticipants(): Participant[] {
    return this.reverseAuctionStore.participants.value;
  }

  getSocketId(): string | null {
    return this.reverseAuctionStore.getSocketId();
  }

  async startLocalStream(): Promise<void> {
    if (!this.webRTCService) {
      throw new Error('WebRTCService가 설정되지 않았습니다.');
    }

    try {
      const stream = await this.webRTCService.startLocalStream();
      this.videoStore.setLocalStream(stream);

      const currentRoom = this.reverseAuctionStore.currentRoom.value;
      const roomId = currentRoom?.roomId || this.reverseAuctionStore.getRoomService()?.getCurrentRoomRef();

      if (roomId) {
        // WebRTCService에 현재 룸 ID 설정
        this.webRTCService.setCurrentRoomRef(roomId);

        // 현재 참가자 목록 가져오기
        const currentParticipants = this.reverseAuctionStore.participants.value;
        const mySocketId = this.reverseAuctionStore.getSocketId();

        console.log('[DEBUG] PeerConnection 생성 준비:', {
          roomId,
          currentParticipants: currentParticipants.length,
          mySocketId,
          participants: currentParticipants.map((p) => ({ socketId: p.socketId, name: p.name })),
        });

        if (currentParticipants.length > 0 && mySocketId) {
          currentParticipants.forEach((participant) => {
            if (participant.socketId !== mySocketId) {
              console.log('[DEBUG] PeerConnection 생성 시작:', participant.socketId);
              setTimeout(() => {
                this.webRTCService?.createPeerConnection(participant.socketId, true).catch((error) => {
                  console.error('[ERROR] PeerConnection 생성 실패:', error);
                });
              }, 100);
            }
          });
        } else {
          console.warn('[WARN] PeerConnection 생성 불가: 참가자 없음 또는 내 socketId 없음', {
            participantsCount: currentParticipants.length,
            mySocketId,
          });
        }
      }
    } catch (error) {
      console.error('[ERROR] 로컬 스트림 획득 실패:', error);
      throw error;
    }
  }

  async stopLocalStream(): Promise<void> {
    const currentRoom = this.reverseAuctionStore.currentRoom.value;
    const roomId = currentRoom?.roomId || this.reverseAuctionStore.getRoomService()?.getCurrentRoomRef();

    if (roomId && this.webRTCService) {
      await this.webRTCService.sendVideoStopped(roomId);
    }

    if (this.webRTCService) {
      this.webRTCService.stopLocalStream();
    }

    this.videoStore.setIsVideoEnabled(false);
  }

  setVideoRef(socketId: string, element: HTMLVideoElement | null): void {
    if (this.webRTCService) {
      this.webRTCService.setVideoRef(socketId, element);
    }
  }

  // Signal 기반 접근 (폴링 제거를 위해 추가)
  getLocalStreamSignal(): Signal<MediaStream | null> {
    return this.videoStore.localStream;
  }

  getIsVideoEnabledSignal(): Signal<boolean> {
    return this.videoStore.isVideoEnabled;
  }

  getParticipantsSignal(): Signal<Participant[]> {
    return this.reverseAuctionStore.participants;
  }

  getSocketIdSignal(): Signal<string | null> {
    return this.reverseAuctionStore.getSocketIdSignal();
  }
}
