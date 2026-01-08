const cron = require('node-cron');
const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('./notificationService');

class SchedulerService {
  initialize() {
    // 1시간마다 실행 (매시 0분에 실행)
    cron.schedule('0 * * * *', () => {
      console.log('[Scheduler] Checking for scheduled notifications...');
      this.processScheduledNotifications();
    });
    
    console.log('Scheduler Service Initialized (1-hour interval)');
  }

  async processScheduledNotifications() {
    try {
      const now = new Date();
      // 예약 시간이 지났고 아직 발송되지 않은 알림 조회
      const pendingNotifications = await Notification.find({
        scheduledAt: { $lte: now },
        isSent: false
      });

      console.log(`[Scheduler] Found ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('[Scheduler] Error processing notifications:', error);
    }
  }

  async sendNotification(notification) {
    try {
      let targetUserIds = [];
      
      if (notification.targetType === 'all') {
        const users = await User.find().select('_id');
        targetUserIds = users.map(u => u._id.toString());
      } else if (notification.targetType === 'organization') {
        const users = await User.find({ orgId: notification.targetId }).select('_id');
        targetUserIds = users.map(u => u._id.toString());
      }

      if (targetUserIds.length > 0) {
        await notificationService.notifyGlobal(
          targetUserIds,
          notification.title,
          notification.content
        );
        
        notification.isSent = true;
        await notification.save();
        console.log(`[Scheduler] Notification sent: ${notification.title}`);
      }
    } catch (error) {
      console.error(`[Scheduler] Failed to send notification ${notification._id}:`, error);
    }
  }
}

module.exports = new SchedulerService();
