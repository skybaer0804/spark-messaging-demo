import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from '../../../services/ConnectionService';
import { parseMessageContent } from '../../../utils/messageUtils';

export type StreamReceivedCallback = (socketId: string, stream: MediaStream) => void;
export type VideoStoppedCallback = (socketId: string) => void;

export class WebRTCService {
  private client: SparkMessaging;
  private connectionService: ConnectionService;
  private unsubscribeCallbacks: Array<() => void> = [];
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private videoRefs: Map<string, HTMLVideoElement> = new Map();
  private currentRoomRef: string | null = null;
  private streamReceivedCallback: StreamReceivedCallback | null = null;
  private videoStoppedCallback: VideoStoppedCallback | null = null;

  constructor(client: SparkMessaging, connectionService: ConnectionService) {
    this.client = client;
    this.connectionService = connectionService;
  }

  public setCurrentRoomRef(roomId: string | null) {
    console.log('[DEBUG] WebRTCService setCurrentRoomRef:', {
      roomId,
      previousRoomRef: this.currentRoomRef,
    });
    this.currentRoomRef = roomId;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public setVideoRef(socketId: string, element: HTMLVideoElement | null) {
    if (element) {
      console.log('[DEBUG] 비디오 엘리먼트 설정:', {
        socketId,
        elementId: element.id,
        hasSrcObject: !!element.srcObject,
      });
      this.videoRefs.set(socketId, element);
    } else {
      console.log('[DEBUG] 비디오 엘리먼트 제거:', socketId);
      this.videoRefs.delete(socketId);
    }
  }

  public async startLocalStream(): Promise<MediaStream> {
    console.log('[DEBUG] 로컬 스트림 시작 요청');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('[DEBUG] 로컬 스트림 획득 성공:', {
        id: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrackEnabled: stream.getVideoTracks()[0]?.enabled,
        videoTrackReadyState: stream.getVideoTracks()[0]?.readyState,
      });
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('[ERROR] 로컬 스트림 획득 실패:', error);
      throw error;
    }
  }

  public stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // 모든 PeerConnection 종료
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();
  }

  public async sendVideoStopped(roomId: string): Promise<void> {
    if (!this.currentRoomRef && roomId) {
      this.currentRoomRef = roomId;
    }
    if (this.currentRoomRef) {
      await this.client.sendRoomMessage(
        this.currentRoomRef,
        'video-stopped' as any,
        JSON.stringify({
          stopped: true,
        }),
      );
    }
  }

  public async createPeerConnection(targetSocketId: string, isInitiator: boolean): Promise<void> {
    console.log('[DEBUG] PeerConnection 생성 시작:', {
      targetSocketId,
      isInitiator,
      currentRoomRef: this.currentRoomRef,
      hasLocalStream: !!this.localStream,
    });

    if (!this.currentRoomRef) {
      console.warn('[WARN] PeerConnection 생성 불가: roomId 없음');
      return;
    }

    const status = this.connectionService.getConnectionStatus();
    if (!status.socketId) {
      console.warn('[WARN] PeerConnection 생성 불가: socketId 없음');
      return;
    }

    // 이미 PeerConnection이 있으면 재사용
    if (this.peerConnections.has(targetSocketId)) {
      console.log('[DEBUG] 이미 PeerConnection 존재:', targetSocketId);
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // PeerConnection 상태 변경 로깅
    pc.onconnectionstatechange = () => {
      console.log('[DEBUG] PeerConnection 상태 변경:', {
        targetSocketId,
        state: pc.connectionState,
      });
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[DEBUG] ICE 연결 상태 변경:', {
        targetSocketId,
        iceConnectionState: pc.iceConnectionState,
      });
    };

    // 로컬 스트림 추가
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      console.log('[DEBUG] 로컬 스트림 트랙 추가:', {
        targetSocketId,
        trackCount: tracks.length,
        videoTracks: tracks.filter((t) => t.kind === 'video').length,
        audioTracks: tracks.filter((t) => t.kind === 'audio').length,
      });
      tracks.forEach((track) => {
        pc.addTrack(track, this.localStream!);
        console.log('[DEBUG] 트랙 추가됨:', { targetSocketId, kind: track.kind, enabled: track.enabled });
      });
    } else {
      console.warn('[WARN] 로컬 스트림이 없어서 트랙을 추가할 수 없음:', targetSocketId);
    }

    // 원격 스트림 수신
    pc.ontrack = (event) => {
      console.log('[DEBUG] ontrack 이벤트 발생:', {
        targetSocketId,
        streams: event.streams.length,
        track: event.track?.kind,
        trackId: event.track?.id,
      });
      const remoteStream = event.streams[0];
      if (remoteStream) {
        console.log('[DEBUG] 원격 스트림 수신:', {
          targetSocketId,
          streamId: remoteStream.id,
          active: remoteStream.active,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length,
        });

        // ParticipantService에 스트림 업데이트 알림 (Store를 통해 전달)
        // 실제 비디오 엘리먼트 설정은 useEffect에서 처리
        if (this.streamReceivedCallback) {
          console.log('[DEBUG] streamReceivedCallback 호출:', targetSocketId);
          this.streamReceivedCallback(targetSocketId, remoteStream);
        }
      } else {
        console.warn('[WARN] 원격 스트림이 없음:', targetSocketId);
      }
    };

    // ICE candidate 수집
    pc.onicecandidate = (event) => {
      if (event.candidate && this.currentRoomRef) {
        this.client
          .sendRoomMessage(
            this.currentRoomRef,
            'ice-candidate' as any,
            JSON.stringify({
              candidate: event.candidate,
              to: targetSocketId,
            }),
          )
          .catch(console.error);
      }
    };

    this.peerConnections.set(targetSocketId, pc);

    // Offer 생성 및 전송 (초기화자인 경우)
    if (isInitiator) {
      try {
        console.log('[DEBUG] Offer 생성 시작:', targetSocketId);
        const offer = await pc.createOffer();
        console.log('[DEBUG] Offer 생성 완료:', {
          targetSocketId,
          type: offer.type,
          sdp: offer.sdp?.substring(0, 100) + '...',
        });
        await pc.setLocalDescription(offer);
        console.log('[DEBUG] LocalDescription 설정 완료:', targetSocketId);

        if (!this.currentRoomRef) {
          console.error('[ERROR] 룸 ID 없음 - Offer 전송 불가');
          return;
        }

        console.log('[DEBUG] Offer 전송:', { targetSocketId, roomId: this.currentRoomRef });
        await this.client.sendRoomMessage(
          this.currentRoomRef,
          'webrtc-offer' as any,
          JSON.stringify({
            sdp: offer,
            to: targetSocketId,
          }),
        );
        console.log('[DEBUG] Offer 전송 완료:', targetSocketId);
      } catch (error) {
        console.error('[ERROR] Offer 생성 실패:', { targetSocketId, error });
      }
    }
  }

  public onRoomMessage(callbacks: {
    onStreamReceived?: StreamReceivedCallback;
    onVideoStopped?: VideoStoppedCallback;
  }): () => void {
    // 스트림 수신 콜백 저장
    if (callbacks.onStreamReceived) {
      this.streamReceivedCallback = callbacks.onStreamReceived;
    }
    if (callbacks.onVideoStopped) {
      this.videoStoppedCallback = callbacks.onVideoStopped;
    }
    const unsubscribe = this.client.onRoomMessage((msg: any) => {
      const msgType = msg.type || (msg as any).type;
      const parsedContent = parseMessageContent(msg.content);
      const fromSocketId = (msg as any).from || msg.senderId;
      const status = this.connectionService.getConnectionStatus();
      const mySocketId = status.socketId;

      const isWebRTCMessage = msgType === 'webrtc-offer' || msgType === 'webrtc-answer' || msgType === 'ice-candidate';
      const isVideoStoppedMessage = msgType === 'video-stopped';

      if (!isWebRTCMessage && !isVideoStoppedMessage) {
        return;
      }

      // video-stopped 메시지 처리
      if (isVideoStoppedMessage && fromSocketId !== mySocketId && this.videoStoppedCallback) {
        this.videoStoppedCallback(fromSocketId);
        return;
      }

      // WebRTC 메시지는 currentRoomRef가 없어도 처리 가능하도록
      if (isWebRTCMessage && !this.currentRoomRef && msg.room) {
        this.currentRoomRef = msg.room;
      }

      switch (msgType) {
        case 'webrtc-offer':
          const offerTo = parsedContent?.to;
          if (offerTo && offerTo !== mySocketId) {
            break;
          }

          if (fromSocketId !== mySocketId && parsedContent?.sdp) {
            this.handleWebRTCOffer(parsedContent.sdp, fromSocketId).catch((error) => {
              console.error('[ERROR] Offer 처리 중 오류:', error);
            });
          }
          break;

        case 'webrtc-answer':
          const answerTo = parsedContent?.to;
          if (answerTo && answerTo !== mySocketId) {
            break;
          }

          if (fromSocketId !== mySocketId && parsedContent?.sdp) {
            this.handleWebRTCAnswer(parsedContent.sdp, fromSocketId);
          }
          break;

        case 'ice-candidate':
          const candidateTo = parsedContent?.to;
          if (candidateTo && candidateTo !== mySocketId) {
            break;
          }

          if (fromSocketId !== mySocketId && parsedContent?.candidate) {
            this.handleICECandidate(parsedContent.candidate, fromSocketId);
          }
          break;
      }
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  private async handleWebRTCOffer(sdp: RTCSessionDescriptionInit, fromSocketId: string): Promise<void> {
    const status = this.connectionService.getConnectionStatus();
    if (!status.socketId) {
      console.warn('[WARN] Offer 처리 불가: socketId 없음');
      return;
    }

    let pc = this.peerConnections.get(fromSocketId);
    if (!pc) {
      await this.createPeerConnection(fromSocketId, false);
      pc = this.peerConnections.get(fromSocketId);
    }

    if (!pc) {
      console.error('[ERROR] PeerConnection 생성 실패');
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (!this.currentRoomRef) {
        console.error('[ERROR] 룸 ID 없음 - Answer 전송 불가');
        return;
      }

      await this.client.sendRoomMessage(
        this.currentRoomRef,
        'webrtc-answer' as any,
        JSON.stringify({
          sdp: answer,
          to: fromSocketId,
        }),
      );
    } catch (error) {
      console.error('[ERROR] Offer 처리 실패:', error);
    }
  }

  private async handleWebRTCAnswer(sdp: RTCSessionDescriptionInit, fromSocketId: string): Promise<void> {
    const pc = this.peerConnections.get(fromSocketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (error) {
        console.error('[ERROR] Answer 처리 실패:', error);
      }
    }
  }

  private async handleICECandidate(candidate: RTCIceCandidateInit, fromSocketId: string): Promise<void> {
    const pc = this.peerConnections.get(fromSocketId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('[ERROR] ICE candidate 처리 실패:', error);
      }
    }
  }

  public getPeerConnection(socketId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(socketId);
  }

  public cleanup() {
    this.stopLocalStream();
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.videoRefs.clear();
    this.currentRoomRef = null;
  }
}
