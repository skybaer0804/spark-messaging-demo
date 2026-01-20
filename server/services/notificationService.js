const webpush = require('web-push');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

class NotificationService {
  async sendPushNotification(userId, payload, roomId = null, messageData = null) {
    try {
      const User = require('../models/User');
      const UserChatRoom = require('../models/UserChatRoom');
      const userService = require('./userService');

      const user = await User.findById(userId);
      if (!user) return;

      // 1. [제거됨] 전역 알림 설정 확인 (UserChatRoom 기반 모드로 통합)

      // 2. 방별 알림 설정 확인 (UserChatRoom 기반)
      if (roomId) {
        const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
        if (userChatRoom) {
          const mode = userChatRoom.notificationMode || 'default';
          
          if (mode === 'none') {
            return; // 알림 차단
          }
          
          if (mode === 'mention') {
            // 멘션 체크
            if (messageData) {
              const userIdStr = userId.toString();
              const mentions = messageData.mentions || [];
              const isMentioned = 
                mentions.some(m => m.toString() === userIdStr) ||
                messageData.mentionAll ||
                messageData.mentionHere;
              
              if (!isMentioned) {
                return; // 멘션되지 않았으면 알림 차단
              }
            } else {
              return; // 메시지 데이터가 없으면 차단
            }
          }
        }
      }

      // 3. [v2.4.0] 현재 유저가 이미 해당 방에 있는지 확인 (Redis 기반)
      if (roomId) {
        const activeRoomId = await userService.getActiveRoom(userId);
        if (activeRoomId === roomId.toString()) {
          console.log(`[Push] User ${userId} is already in room ${roomId}. Skipping push.`);
          return;
        }
      }

      // 4. 해당 유저의 모든 활성 기기 구독 정보 조회
      const subscriptions = await PushSubscription.find({ userId, isActive: true });

      if (subscriptions.length === 0) {
        return;
      }

      const pushPayload = JSON.stringify(payload);

      const pushPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, pushPayload);
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(`Push subscription for device ${sub.deviceId} has expired. Deactivating.`);
            sub.isActive = false;
            await sub.save();
          } else {
            console.error(`Error sending push to device ${sub.deviceId}:`, error);
          }
        }
      });

      await Promise.all(pushPromises);
      console.log(`[Push] Notification sent to user: ${userId} (${subscriptions.length} devices)`);
    } catch (error) {
      console.error('[Push] Error in sendPushNotification:', error);
    }
  }

  // 채팅 메시지 알림 전송 유틸리티
  async notifyNewMessage(recipientIds, senderName, messageContent, roomId, messageData = null) {
    console.log(`[Push] Notifying new message to recipients: ${recipientIds.join(', ')}`);
    const payload = {
      title: `${senderName}님의 메시지`,
      body: messageContent,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: `/chatapp/chat/${roomId}`, // v2.4.0: 정확한 프론트엔드 경로로 수정
        roomId: roomId,
      },
    };

    // messageData에 mentions 정보 포함하여 전달
    const mentionData = messageData ? {
      mentions: messageData.mentions || [],
      mentionAll: messageData.mentionAll || false,
      mentionHere: messageData.mentionHere || false,
    } : null;

    const pushPromises = recipientIds.map((userId) => 
      this.sendPushNotification(userId, payload, roomId, mentionData)
    );

    await Promise.all(pushPromises);
  }

  // 글로벌 공지사항 알림 전송
  async notifyGlobal(recipientIds, title, content, metadata = {}) {
    const payload = {
      title: title,
      body: content,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: metadata.actionUrl || metadata.url || '/',
        ...metadata,
      },
    };

    const pushPromises = recipientIds.map((userId) => this.sendPushNotification(userId, payload));

    await Promise.all(pushPromises);
  }
}

module.exports = new NotificationService();
