const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

exports.createNotification = async (req, res) => {
  try {
    const { title, content, scheduledAt, targetType, targetId } = req.body;
    const senderId = req.user.id;

    // Admin 권한 체크 (미들웨어에서도 할 수 있지만 컨트롤러에서도 명시적 확인)
    const user = await User.findById(senderId);
    if (user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can send notifications' });
    }

    const newNotification = new Notification({
      title,
      content,
      senderId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      targetType: targetType || 'all',
      targetId: targetId || null,
    });

    await newNotification.save();

    // 예약 발송이 아니면 즉시 발송
    if (!scheduledAt) {
      // 1시간 단위 스케줄러가 처리하게 할 수도 있지만, 
      // 즉시 발송 요청인 경우 여기서 트리거 가능
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
    const userIds = users.map(u => u._id.toString());
    
    if (userIds.length > 0) {
      notificationService.notifyGlobal(
        userIds,
        notification.title,
        notification.content
      );
      
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
