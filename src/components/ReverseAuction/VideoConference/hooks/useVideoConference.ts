import { useEffect, useRef } from 'preact/hooks';
import type { VideoConferenceAdapter } from '../types';

export function useVideoConference(adapter: VideoConferenceAdapter) {
  const videoElementRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Signal 기반 접근 (폴링 제거)
  const localStreamSignal = adapter.getLocalStreamSignal?.();
  const isVideoEnabledSignal = adapter.getIsVideoEnabledSignal?.();
  const participantsSignal = adapter.getParticipantsSignal?.();
  const socketIdSignal = adapter.getSocketIdSignal?.();

  // Signal이 있으면 직접 사용 (자동 반응형 업데이트)
  // Signal.value를 읽으면 자동으로 구독되므로 컴포넌트가 리렌더링됨
  // Signal이 없으면 fallback으로 getter 사용 (하위 호환성)
  const localStream = localStreamSignal?.value ?? adapter.getLocalStream();
  const isVideoEnabled = isVideoEnabledSignal?.value ?? adapter.isVideoEnabled();
  const participants = participantsSignal?.value ?? adapter.getParticipants();
  const socketId = socketIdSignal?.value ?? adapter.getSocketId();

  // Signal이 변경될 때 컴포넌트가 리렌더링되도록 함
  // Signal.value를 읽으면 자동으로 구독되므로 추가 작업 불필요
  // 하지만 명시적으로 Signal을 사용하여 반응성을 보장
  if (localStreamSignal) {
    // Signal을 읽어서 구독 (의존성 배열에 포함)
    void localStreamSignal.value;
  }
  if (isVideoEnabledSignal) {
    void isVideoEnabledSignal.value;
  }
  if (participantsSignal) {
    void participantsSignal.value;
  }
  if (socketIdSignal) {
    void socketIdSignal.value;
  }

  // localStream이 변경될 때 로컬 비디오 엘리먼트 업데이트
  useEffect(() => {
    const currentStream = localStreamSignal?.value ?? localStream;
    if (localVideoRef.current && currentStream) {
      if (localVideoRef.current.srcObject !== currentStream) {
        localVideoRef.current.srcObject = currentStream;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch((error) => {
          console.error('[ERROR] 로컬 비디오 재생 실패:', error);
        });
      }
    } else if (localVideoRef.current && !currentStream) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream, localStreamSignal?.value]);

  // participant.stream이 변경될 때 비디오 엘리먼트 업데이트
  useEffect(() => {
    const currentParticipants = participantsSignal?.value ?? participants;
    const currentSocketId = socketIdSignal?.value ?? socketId;

    currentParticipants.forEach((participant) => {
      if (participant.socketId === currentSocketId) return; // 로컬 비디오는 제외

      const videoElement = videoElementRefs.current.get(participant.socketId);
      if (!videoElement) return;

      if (participant.stream) {
        // 스트림이 다르거나 아직 설정되지 않은 경우에만 업데이트
        if (videoElement.srcObject !== participant.stream) {
          videoElement.srcObject = participant.stream;
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.muted = false;

          // canplay 이벤트 후 재생 시도 (가장 안정적)
          const handleCanPlay = () => {
            videoElement.play().catch((error) => {
              // AbortError는 무시
              if (error.name !== 'AbortError') {
                console.error('[ERROR] 비디오 재생 실패:', { socketId: participant.socketId, error });
              }
            });
            videoElement.removeEventListener('canplay', handleCanPlay);
          };

          videoElement.addEventListener('canplay', handleCanPlay, { once: true });

          // 이미 재생 가능한 상태면 즉시 시도
          if (videoElement.readyState >= 2) {
            handleCanPlay();
          }
        }
      } else {
        // 스트림이 없으면 정리
        videoElement.srcObject = null;
      }
    });
  }, [participants, participantsSignal?.value, socketId, socketIdSignal?.value]);

  const handleStartLocalStream = async () => {
    await adapter.startLocalStream();
  };

  const handleStopLocalStream = async () => {
    await adapter.stopLocalStream();
  };

  const handleSetVideoRef = (socketId: string, element: HTMLVideoElement | null) => {
    if (element) {
      videoElementRefs.current.set(socketId, element);
    } else {
      videoElementRefs.current.delete(socketId);
    }
    adapter.setVideoRef(socketId, element);
  };

  return {
    localStream,
    isVideoEnabled,
    participants,
    socketId,
    localVideoRef,
    videoElementRefs,
    handleStartLocalStream,
    handleStopLocalStream,
    handleSetVideoRef,
    // Signal도 반환하여 컴포넌트에서 직접 사용 가능하도록
    localStreamSignal,
    isVideoEnabledSignal,
    participantsSignal,
    socketIdSignal,
  };
}
