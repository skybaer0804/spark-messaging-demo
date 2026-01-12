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
}

module.exports = new SocketService();
