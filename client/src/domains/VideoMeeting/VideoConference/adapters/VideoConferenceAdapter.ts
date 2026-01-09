import type { VideoConferenceAdapter, VideoConferenceMessage } from '../types';
import type { VideoStore } from '../../stores/VideoStore';
import type { VideoMeetingStore } from '../../stores/VideoMeetingStore';
import type { WebRTCService } from '../../services/WebRTCService';

export class VideoMeetingVideoConferenceAdapter implements VideoConferenceAdapter {
  private videoStore: VideoStore;
  private videoMeetingStore: VideoMeetingStore;
  private webRTCService: WebRTCService;

  constructor(videoStore: VideoStore, videoMeetingStore: VideoMeetingStore, webRTCService: WebRTCService) {
    this.videoStore = videoStore;
    this.videoMeetingStore = videoMeetingStore;
    this.webRTCService = webRTCService;
  }

  // ... (rest of the file remains same, just replacing types)
  getLocalStream() {
    return this.videoStore.localStream.value;
  }
  getRemoteStreams() {
    return this.videoStore.remoteStreams.value;
  }
  isConnected() {
    return this.videoMeetingStore.isConnected.value;
  }
  async toggleVideo() {
    await this.webRTCService.toggleVideo();
  }
  async toggleAudio() {
    await this.webRTCService.toggleAudio();
  }
  async leave() {
    await this.videoMeetingStore.leaveRoom();
  }
}
