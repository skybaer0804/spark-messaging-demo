import { VideoConference } from './VideoConference/VideoConference';
import { ReverseAuctionVideoConferenceAdapter } from './VideoConference/adapters/VideoConferenceAdapter';
import { Chat } from '../Chat/Chat';
import { ReverseAuctionChatAdapter } from './adapters/ReverseAuctionChatAdapter';
import { ReverseAuctionCore } from './ReverseAuctionCore/ReverseAuctionCore';
import { ChatStore } from './stores/ChatStore';
import { ReverseAuctionStore } from './stores/ReverseAuctionStore';
import { VideoStore } from './stores/VideoStore';
import './ReverseAuction.scss';

// Store와 Adapter를 컴포넌트 외부에서 생성하여 한 번만 생성되도록 보장
let reverseAuctionStoreInstance: ReverseAuctionStore | null = null;
let chatStoreInstance: ChatStore | null = null;
let videoStoreInstance: VideoStore | null = null;
let chatAdapterInstance: ReverseAuctionChatAdapter | null = null;
let videoConferenceAdapterInstance: ReverseAuctionVideoConferenceAdapter | null = null;

function initializeStores() {
  if (!reverseAuctionStoreInstance) {
    try {
      console.log('[DEBUG] Store 초기화 시작');
      reverseAuctionStoreInstance = new ReverseAuctionStore();
      chatStoreInstance = new ChatStore();
      videoStoreInstance = new VideoStore();

      // Store 초기화
      reverseAuctionStoreInstance.initialize();
      console.log('[DEBUG] ReverseAuctionStore 초기화 완료');

      // ChatStore 연결
      reverseAuctionStoreInstance.setChatStore(chatStoreInstance);

      // ChatAdapter 생성 (Store에서 서비스 가져오기)
      const chatService = reverseAuctionStoreInstance.getChatService();
      const fileTransferService = reverseAuctionStoreInstance.getFileTransferService();

      if (chatService) {
        chatAdapterInstance = new ReverseAuctionChatAdapter(
          chatStoreInstance,
          reverseAuctionStoreInstance,
          chatService,
          fileTransferService,
        );
        console.log('[DEBUG] ChatAdapter 생성 완료');
      } else {
        console.warn('[WARN] ChatService가 없습니다.');
      }

      // VideoConferenceAdapter 생성 (Store 기반)
      const webRTCService = reverseAuctionStoreInstance.getWebRTCService();
      videoConferenceAdapterInstance = new ReverseAuctionVideoConferenceAdapter(
        videoStoreInstance,
        reverseAuctionStoreInstance,
        webRTCService,
      );
      console.log('[DEBUG] VideoConferenceAdapter 생성 완료');
      console.log('[DEBUG] 모든 Store 초기화 완료');
    } catch (error) {
      console.error('[ERROR] Store 초기화 실패:', error);
      throw error;
    }
  }
}

export function ReverseAuction() {
  // Store 초기화 (한 번만 실행)
  initializeStores();

  const reverseAuctionStore = reverseAuctionStoreInstance!;
  const videoConferenceAdapter = videoConferenceAdapterInstance;

  const currentRoom = reverseAuctionStore.currentRoom.value;

  return (
    <div className="reverse-auction">
      {/* 역경매 핵심 로직 (룸 리스트, 룸 생성, 참가 요청 등) */}
      <ReverseAuctionCore store={reverseAuctionStore} />

      {/* 룸 상세 화면에서만 영상과 채팅 표시 */}
      {currentRoom && (
        <div className="reverse-auction__main-content">
          {/* 영상 영역 */}
          <div className="reverse-auction__video-section">
            {videoConferenceAdapter && <VideoConference adapter={videoConferenceAdapter} />}
          </div>

          {/* 채팅 영역 */}
          <div className="reverse-auction__chat-section">
            {chatAdapterInstance && <Chat adapter={chatAdapterInstance} classNamePrefix="reverse-auction__chat" />}
          </div>
        </div>
      )}
    </div>
  );
}
