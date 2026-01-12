const webpush = require('web-push');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

class NotificationService {
  async sendPushNotification(userId, payload, roomId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // 1. 전역 알림 설정 확인
      if (user.notificationSettings && user.notificationSettings.globalEnabled === false) {
        return;
      }

      // 2. 방별 알림 설정 확인
      if (roomId && user.notificationSettings && user.notificationSettings.roomPreferences) {
        const roomPref = user.notificationSettings.roomPreferences.get(roomId.toString());
        if (roomPref === false) {
          return;
        }
      }

      // 3. 해당 유저의 모든 활성 기기 구독 정보 조회
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
  async notifyNewMessage(recipientIds, senderName, messageContent, roomId) {
    console.log(`[Push] Notifying new message to recipients: ${recipientIds.join(', ')}`);
    const payload = {
      title: `${senderName}님의 메시지`,
      body: messageContent,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: `/chat/${roomId}`,
        roomId: roomId
      }
    };

    const pushPromises = recipientIds.map(userId => 
      this.sendPushNotification(userId, payload, roomId)
    );

    await Promise.all(pushPromises);
  }

  // 글로벌 공지사항 알림 전송
  async notifyGlobal(recipientIds, title, content) {
    const payload = {
      title: title,
      body: content,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: '/',
      }
    };

    const pushPromises = recipientIds.map(userId => 
      this.sendPushNotification(userId, payload)
    );

    await Promise.all(pushPromises);
  }
}

module.exports = new NotificationService();
