import type { VideoConferenceAdapter } from '../types';
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

  getLocalStream() {
    return this.webRTCService.getLocalStream();
  }
  isVideoEnabled() {
    return this.videoStore.isVideoEnabled.value;
  }
  getParticipants() {
    return this.videoMeetingStore.participants.value;
  }
  getSocketId() {
    return this.videoMeetingStore.socketId.value;
  }
  async startLocalStream() {
    const stream = await this.webRTCService.startLocalStream();
    this.videoStore.setLocalStream(stream);
  }
  async stopLocalStream() {
    this.webRTCService.stopLocalStream();
    this.videoStore.setLocalStream(null);
  }
  setVideoRef(socketId: string, element: HTMLVideoElement | null) {
    this.webRTCService.setVideoRef(socketId, element);
  }

  // Signal 기반 접근
  getLocalStreamSignal() {
    return this.videoStore.localStream;
  }
  getIsVideoEnabledSignal() {
    return this.videoStore.isVideoEnabled;
  }
  getParticipantsSignal() {
    return this.videoMeetingStore.participants;
  }
  getSocketIdSignal() {
    return this.videoMeetingStore.socketId;
  }

  isConnected() {
    return this.videoMeetingStore.isConnected.value;
  }
  async toggleVideo() {
    await this.videoMeetingStore.toggleVideo();
  }
  async toggleAudio() {
    await this.videoMeetingStore.toggleAudio();
  }
  async leave() {
    await this.videoMeetingStore.leaveRoom();
  }
}
