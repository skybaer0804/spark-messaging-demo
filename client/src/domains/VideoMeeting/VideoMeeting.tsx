import { useEffect } from 'preact/hooks';
import { VideoConference } from './VideoConference/VideoConference';
import { VideoMeetingVideoConferenceAdapter } from './VideoConference/adapters/VideoConferenceAdapter';
import { Chat } from '@/domains/Chat';
import { VideoMeetingChatAdapter } from './adapters/VideoMeetingChatAdapter';
import { VideoMeetingCore } from './VideoMeetingCore/VideoMeetingCore';
import { ChatStore } from './stores/ChatStore';
import { VideoMeetingStore } from './stores/VideoMeetingStore';
import { VideoStore } from './stores/VideoStore';
import { useToast } from '@/core/context/ToastContext';
import './VideoMeeting.scss';

// Store와 Adapter를 컴포넌트 외부에서 생성하여 한 번만 생성되도록 보장
let videoMeetingStoreInstance: VideoMeetingStore | null = null;
let chatStoreInstance: ChatStore | null = null;
let videoStoreInstance: VideoStore | null = null;
let chatAdapterInstance: VideoMeetingChatAdapter | null = null;
let videoConferenceAdapterInstance: VideoMeetingVideoConferenceAdapter | null = null;

function initializeStores(toast: { showSuccess: (m: string) => void; showError: (m: string) => void }) {
  if (!videoMeetingStoreInstance) {
    try {
      console.log('[DEBUG] Store 초기화 시작');
      videoMeetingStoreInstance = new VideoMeetingStore();
      videoMeetingStoreInstance.setToast(toast);
      chatStoreInstance = new ChatStore();
      videoStoreInstance = new VideoStore();

      // Store 초기화
      videoMeetingStoreInstance.initialize();
      console.log('[DEBUG] VideoMeetingStore 초기화 완료');

      // ChatStore 연결
      videoMeetingStoreInstance.setChatStore(chatStoreInstance);

      // VideoStore 연결
      videoMeetingStoreInstance.setVideoStore(videoStoreInstance);

      // ChatAdapter 생성 (Store에서 서비스 가져오기)
      const chatService = videoMeetingStoreInstance.getChatService();
      const fileTransferService = videoMeetingStoreInstance.getFileTransferService();

      if (chatService) {
        chatAdapterInstance = new VideoMeetingChatAdapter(
          chatStoreInstance,
          videoMeetingStoreInstance,
          chatService,
          fileTransferService,
        );
        console.log('[DEBUG] ChatAdapter 생성 완료');
      } else {
        console.warn('[WARN] ChatService가 없습니다.');
      }

      // VideoConferenceAdapter 생성 (Store 기반)
      const webRTCService = videoMeetingStoreInstance.getWebRTCService();
      if (webRTCService) {
        videoConferenceAdapterInstance = new VideoMeetingVideoConferenceAdapter(
          videoStoreInstance,
          videoMeetingStoreInstance,
          webRTCService,
        );
        console.log('[DEBUG] VideoConferenceAdapter 생성 완료');
      } else {
        console.warn('[WARN] WebRTCService가 없습니다.');
      }
      console.log('[DEBUG] 모든 Store 초기화 완료');
    } catch (error) {
      console.error('[ERROR] Store 초기화 실패:', error);
      throw error;
    }
  } else {
    // 인스턴스가 이미 있으면 toast 함수만 업데이트
    videoMeetingStoreInstance.setToast(toast);
  }
}

export function VideoMeeting() {
  const toast = useToast();
  // Store 초기화 (한 번만 실행)
  initializeStores(toast);

  const videoMeetingStore = videoMeetingStoreInstance!;
  const videoConferenceAdapter = videoConferenceAdapterInstance;

  const currentRoom = videoMeetingStore.currentRoom.value;

  useEffect(() => {
    // URL query parameter 확인 (guest join용)
    const params = new URLSearchParams(window.location.search);
    const joinHash = params.get('join');
    const guestNickname = sessionStorage.getItem('guest_nickname');

    if (joinHash && guestNickname) {
      // 게스트 입장 로직 수행
      console.log(`[Guest] Joining meeting with hash: ${joinHash} as ${guestNickname}`);
      videoMeetingStore.joinAsGuest(joinHash, guestNickname);
    }
  }, []);

  return (
    <div className="video-meeting">
      {/* 화상회의 핵심 로직 (룸 리스트, 룸 생성, 참가 요청 등) */}
      <VideoMeetingCore store={videoMeetingStore} />

      {/* 룸 상세 화면에서만 영상과 채팅 표시 */}
      {currentRoom && (
        <div className="video-meeting__main-content">
          {/* 모바일: 상단-영상-채팅 순서 */}
          {/* PC: 영상-채팅 가로 배치 */}
          {/* 영상 영역 */}
          <div className="video-meeting__video-section">
            {videoConferenceAdapter && <VideoConference adapter={videoConferenceAdapter} />}
          </div>

          {/* 채팅 영역 */}
          <div className="video-meeting__chat-section">
            {chatAdapterInstance && <Chat adapter={chatAdapterInstance} classNamePrefix="video-meeting__chat" />}
          </div>
        </div>
      )}
    </div>
  );
}
