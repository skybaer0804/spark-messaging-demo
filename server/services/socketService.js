const { SparkMessaging } = require('@skybaer0804/spark-messaging-client');

class SocketService {
  constructor() {
    this.client = null;
  }

  initialize() {
    const serverUrl = process.env.SPARK_SERVER_URL;
    const projectKey = process.env.SPARK_PROJECT_KEY;

    if (!serverUrl || !projectKey) {
      console.error('Spark Messaging configuration missing');
      return;
    }

    this.client = new SparkMessaging(serverUrl, projectKey);
    console.log('Spark Messaging SDK Initialized');

    // v2.3.0: 서버 사이드에서 클라이언트의 접속 상태를 감시하여 상태 및 활성 방 동기화
    // SDK 버전에 따라 .on 메서드가 없을 수 있으므로 방어적 코드로 수정
    if (typeof this.client.on === 'function') {
      this.client.on('CLIENT_CONNECTED', async (data) => {
        const { userId } = data;
        if (userId) {
          const userService = require('./userService');
          await userService.setUserStatus(userId, 'online');
        }
      });

      this.client.on('CLIENT_DISCONNECTED', async (data) => {
        const { userId } = data;
        if (userId) {
          const userService = require('./userService');
          await userService.setUserStatus(userId, 'offline');
          // v2.3.0: 앱 종료 시 활성 방 정보 초기화 (푸시 알림 수신 보장)
          await userService.setActiveRoom(userId, null);
        }
      });

      // v2.4.0: 화상회의 상태 자동 전환 핸들러 및 참가자 알림
      this.client.on('ROOM_JOINED', async (data) => {
        try {
          const { roomId, userId, socketId, participantsCount } = data;

          // 회의 상태 업데이트
          const VideoMeeting = require('../models/VideoMeeting');
          const meeting = await VideoMeeting.findOne({ roomId });

          if (meeting && meeting.status === 'scheduled') {
            meeting.status = 'ongoing';
            await meeting.save();
            console.log(`[Meeting] Meeting ${meeting._id} status changed to ongoing`);
          }

          // 다른 참가자들에게 새로운 사용자 입장 알림 (프론트엔드 로직 이동)
          await this.client.sendRoomMessage(roomId, 'user-joined', {
            socketId,
            userId,
            total: participantsCount,
            timestamp: Date.now(),
          });

          console.log(`[Socket] User ${userId} (${socketId}) joined room ${roomId}. Total: ${participantsCount}`);
        } catch (error) {
          console.error('[Socket] Error in ROOM_JOINED handler:', error);
        }
      });

      this.client.on('ROOM_LEFT', async (data) => {
        try {
          const { roomId, userId, socketId, participantsCount } = data;

          // 다른 참가자들에게 사용자 퇴장 알림
          await this.client.sendRoomMessage(roomId, 'user-left', {
            socketId,
            userId,
            total: participantsCount,
            timestamp: Date.now(),
          });

          if (participantsCount === 0) {
            const VideoMeeting = require('../models/VideoMeeting');
            const ChatRoom = require('../models/ChatRoom'); // v2.4.0 추가
            const meeting = await VideoMeeting.findOne({ roomId });

            if (meeting && meeting.status === 'ongoing') {
              meeting.status = 'completed';
              await meeting.save();
              console.log(`[Meeting] Meeting ${meeting._id} status changed to completed`);

              // v2.4.0: 화상회의 종료 시 연관된 채팅방 삭제 (또는 아카이브)
              if (meeting.roomId) {
                await ChatRoom.findByIdAndDelete(meeting.roomId);
                console.log(`[Meeting] Associated ChatRoom ${meeting.roomId} deleted.`);

                // 클라이언트에게 방 목록 업데이트 알림 (필요시)
                if (userId) {
                  await this.notifyRoomListUpdated(userId);
                }
              }
            }
          }

          console.log(`[Socket] User ${userId} (${socketId}) left room ${roomId}. Total: ${participantsCount}`);
        } catch (error) {
          console.error('[Socket] Error in ROOM_LEFT handler:', error);
        }
      });
    } else {
      console.warn('Spark Messaging SDK does not support .on() event listeners in this version.');
    }
  }

  async sendRoomMessage(roomId, type, content, senderId) {
    if (!this.client) return;

    try {
      // 소켓 서버로 메시지 전송 (브로드캐스트)
      await this.client.sendRoomMessage(roomId, type, {
        content,
        senderId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to send socket message:', error);
    }
  }

  async broadcastEvent(event, data, targetIds = []) {
    if (!this.client) return;

    try {
      // 공통 이벤트 브로드캐스트 (SDK의 sendMessage 활용 가능)
      // targetIds가 있으면 해당 유저들에게만, 없으면 전체 브로드캐스트
      await this.client.sendMessage(event, {
        ...data,
        targetIds,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to broadcast event ${event}:`, error);
    }
  }

  async notifyUnreadCount(userId, roomId, unreadCount) {
    await this.broadcastEvent('UNREAD_COUNT_UPDATED', { roomId, unreadCount }, [userId]);
  }

  async notifyRoomListUpdated(userId, roomData = {}) {
    console.log(`[Socket] Notifying room list update to user ${userId}:`, roomData);
    await this.broadcastEvent('ROOM_LIST_UPDATED', roomData, [userId]);
  }

  async notifyMessageRead(roomId, userId) {
    await this.broadcastEvent('MESSAGE_READ', { roomId, userId });
  }

  /**
   * 메시지 업데이트 브로드캐스트 (썸네일/프리뷰 생성 완료 시)
   * @param {string} roomId - 채팅방 ID
   * @param {Object} updateData - 업데이트 데이터
   */
  async sendMessageUpdate(roomId, updateData) {
    if (!this.client) return;

    try {
      await this.client.sendRoomMessage(roomId, 'message-updated', {
        ...updateData,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to send message update:', error);
    }
  }
}

module.exports = new SocketService();
