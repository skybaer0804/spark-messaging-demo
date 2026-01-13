const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

exports.createNotification = async (req, res) => {
  try {
    const { title, content, scheduledAt, targetType, targetId, actionUrl, metadata } = req.body;
    const senderId = req.user.id;

    // Admin 권한 체크 (대소문자 구분 없이 확인)
    const user = await User.findById(senderId);
    if (!user || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Only Admins can send notifications' });
    }

    const newNotification = new Notification({
      title,
      content,
      senderId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      targetType: targetType || 'all',
      targetId: targetId || null,
      actionUrl: actionUrl || null,
      metadata: metadata || {},
    });

    await newNotification.save();

    // 예약 발송이 아니면 즉시 발송
    if (!scheduledAt) {
      await sendNotificationImmediately(newNotification);
    }

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
};

async function sendNotificationImmediately(notification) {
  try {
    const users = await User.find().select('_id');
    const userIds = users.map((u) => u._id.toString());

    if (userIds.length > 0) {
      notificationService.notifyGlobal(userIds, notification.title, notification.content, {
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
      });

      notification.isSent = true;
      await notification.save();
    }
  } catch (error) {
    console.error('Failed to send immediate notification:', error);
  }
}

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// v2.3.0: 로그인 시 미수신 전체 공지 동기화
exports.syncNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    // lastSyncAt 필드 포함 조회
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 마지막 동기화 시점 확인 (없으면 lastLogoutAt, 그것도 없으면 0)
    const lastSyncAt = user.lastSyncAt || user.lastLogoutAt || new Date(0);

    // 마지막 동기화 이후에 생성된 'all' 대상 공지사항 조회
    const pendingNotifications = await Notification.find({
      targetType: 'all',
      isSent: true,
      createdAt: { $gt: lastSyncAt },
    }).sort({ createdAt: 1 });

    // v2.3.0: 웹 푸시 방식으로 변경 (서버에서 푸시 발송 트리거)
    if (pendingNotifications.length > 0) {
      console.log(`[Sync] Found ${pendingNotifications.length} pending notifications for user ${userId}`);

      // 동기화 시점 업데이트 (중복 방지)
      user.lastSyncAt = new Date();
      await user.save();

      for (const notif of pendingNotifications) {
        // v2.3.0: 실제 Push API를 통해 발송 (다른 기기에서도 수신 가능)
        await notificationService.sendPushNotification(userId, {
          title: `[공지] ${notif.title}`,
          body: notif.content,
          icon: '/asset/spark_icon_192.png',
          data: {
            url: notif.actionUrl || '/',
            notificationId: notif._id,
            ...notif.metadata,
          },
        });
      }
    } else {
      // 새로운 공지가 없더라도 동기화 시점은 현재로 업데이트하여 불필요한 재조회 방지
      user.lastSyncAt = new Date();
      await user.save();
    }

    res.json(pendingNotifications);
  } catch (error) {
    console.error('SyncNotifications error:', error);
    res.status(500).json({ message: 'Failed to sync notifications', error: error.message });
  }
};
