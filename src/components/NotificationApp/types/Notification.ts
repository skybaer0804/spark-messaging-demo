export type ScheduleOption = 'immediate' | '1min' | '5min';

export interface NotificationData {
    content: string;
    scheduledTime: string;
    timestamp: number;
}
