const webpush = require('web-push');
const User = require('../models/User');

class NotificationService {
  async sendPushNotification(userId, payload) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushSubscription) {
        return; // 구독 정보가 없으면 전송 안 함
      }

      const pushPayload = JSON.stringify(payload);

      await webpush.sendNotification(
        user.pushSubscription,
        pushPayload
      );
      
      console.log(`Push notification sent to user: ${userId}`);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log('Push subscription has expired or is no longer valid. Removing from DB.');
        await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: "" } });
      } else {
        console.error('Error sending push notification:', error);
      }
    }
  }

  // 채팅 메시지 알림 전송 유틸리티
  async notifyNewMessage(recipientIds, senderName, messageContent, roomId) {
    const payload = {
      title: `${senderName}님의 메시지`,
      body: messageContent,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: `/chat/${roomId}`,
        roomId: roomId
      }
    };

    // 여러 명에게 푸시 전송 (본인 제외 처리는 호출부에서 진행)
    const pushPromises = recipientIds.map(userId => 
      this.sendPushNotification(userId, payload)
    );

    await Promise.all(pushPromises);
  }
}

module.exports = new NotificationService();

