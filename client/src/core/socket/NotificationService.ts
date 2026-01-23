import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from './ConnectionService';
import type { ScheduleOption, NotificationData } from '@/domains/Notification/types';

export class NotificationService {
  private client: SparkMessaging;
  private connectionService: ConnectionService;

  constructor(client: SparkMessaging, connectionService: ConnectionService) {
    this.client = client;
    this.connectionService = connectionService;
  }

  public getScheduledTime(scheduleOption: ScheduleOption): string {
    const now = new Date();
    switch (scheduleOption) {
      case '1min':
        return new Date(now.getTime() + 60 * 1000).toISOString();
      case '5min':
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      default:
        return new Date().toISOString();
    }
  }

  public async sendNotification(message: string, scheduleOption: ScheduleOption): Promise<void> {
    if (!message.trim()) {
      throw new Error('알림 메시지를 입력해주세요.');
    }

    const status = this.connectionService.getConnectionStatus();
    if (!status.isConnected) {
      throw new Error('서버에 연결되어 있지 않습니다. 연결을 확인해주세요.');
    }

    const notificationData: NotificationData = {
      content: message,
      scheduledTime: this.getScheduledTime(scheduleOption),
      timestamp: Date.now(),
    };

    await this.client.sendMessage('notification', JSON.stringify(notificationData));
  }
}
