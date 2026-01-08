import { useState, useEffect, useRef } from 'preact/hooks';
import { toast } from 'react-toastify';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '../../../services/ConnectionService';
import { NotificationService } from '../../../services/NotificationService';
import type { ScheduleOption } from '../types';

export function useNotificationApp() {
  const [message, setMessage] = useState('');
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('immediate');
  const [isConnected, setIsConnected] = useState(false);

  const notificationServiceRef = useRef<NotificationService | null>(null);

  useEffect(() => {
    const connectionService = new ConnectionService(sparkMessagingClient);
    const notificationService = new NotificationService(sparkMessagingClient, connectionService);

    notificationServiceRef.current = notificationService;

    const status = connectionService.getConnectionStatus();
    setIsConnected(status.isConnected);

    connectionService.onConnectionStateChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      connectionService.cleanup();
    };
  }, []);

  const handleSend = async () => {
    if (!notificationServiceRef.current) return;

    try {
      await notificationServiceRef.current.sendNotification(message, scheduleOption);
      setMessage('');
      setScheduleOption('immediate');
      toast.success('알림이 전송되었습니다.');
    } catch (error) {
      console.error('알림 전송 실패:', error);
      toast.error(`알림 전송에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return {
    message,
    setMessage,
    scheduleOption,
    setScheduleOption,
    isConnected,
    handleSend,
  };
}
