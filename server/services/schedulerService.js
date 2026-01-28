const cron = require('node-cron');
const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('./notificationService');

class SchedulerService {
  initialize() {
    // 매 분마다 실행 (0초에 실행되도록 설정 가능하나 기본적으로 매 분 시작 시 실행)
    cron.schedule('* * * * *', () => {
      this.processScheduledNotifications();
    });

    // 서버 시작 시 미발송된 알림(장애 복구) 체크
    this.recoverMissedNotifications();

    console.log('Scheduler Service Initialized (Every 1 minute interval)');
  }

  async recoverMissedNotifications() {
    try {
      const now = new Date();
      // 예약 시간이 지났거나 현재부터 1분 이내인 미발송 알림 조회
      const missedNotifications = await Notification.find({
        scheduledAt: { $ne: null, $lte: now },
        isSent: false,
      });

      for (const notification of missedNotifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('[Scheduler] Error recovering missed notifications:', error);
    }
  }

  async processScheduledNotifications() {
    try {
      const now = new Date();
      // 예약 시간이 지났고(현재 시간보다 작거나 같음) 아직 발송되지 않은 알림 조회
      const pendingNotifications = await Notification.find({
        scheduledAt: { $ne: null, $lte: now },
        isSent: false,
      });

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
        targetUserIds = users.map((u) => u._id.toString());
      } else if (notification.targetType === 'workspace') {
        const users = await User.find({ workspaces: notification.targetId }).select('_id');
        targetUserIds = users.map((u) => u._id.toString());
      }

      if (targetUserIds.length > 0) {
        await notificationService.notifyGlobal(targetUserIds, notification.title, notification.content, {
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
        });

        notification.isSent = true;
        await notification.save();
      }
    } catch (error) {
      console.error(`[Scheduler] Failed to send notification ${notification._id}:`, error);
    }
  }
}

module.exports = new SchedulerService();
