import { useState, useEffect, useRef } from 'preact/hooks';
import { useToast } from '@/core/context/ToastContext';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { NotificationService } from '@/core/socket/NotificationService';
import { orgApi, notificationApi } from '@/core/api/ApiService';
import type { Organization } from '../../ChatApp/hooks/useChatApp';

export function useNotificationApp() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledAt] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'organization'>('all');
  const [targetId, setTargetId] = useState('');
  const [orgList, setOrgList] = useState<Organization[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { showSuccess, showError } = useToast();
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

    const fetchOrgs = async () => {
      try {
        const res = await orgApi.getOrganizations();
        setOrgList(res.data);
        if (res.data.length > 0) setTargetId(res.data[0]._id);
      } catch (err) {
        console.error('Failed to fetch orgs:', err);
      }
    };

    fetchOrgs();

    return () => {
      connectionService.cleanup();
    };
  }, []);

  const handleSend = async () => {
    try {
      await notificationApi.createNotification({
        title,
        content: message,
        scheduledAt: scheduledDate || undefined,
        targetType,
        targetId: targetType === 'organization' ? targetId : undefined,
      });

      setTitle('');
      setMessage('');
      setScheduledAt('');
      showSuccess('Notification created/sent successfully');
    } catch (error) {
      console.error('Notification creation failed:', error);
      showError('Failed to create notification');
    }
  };

  return {
    title,
    setTitle,
    message,
    setMessage,
    scheduledDate,
    setScheduledAt,
    targetType,
    setTargetType,
    targetId,
    setTargetId,
    orgList,
    isConnected,
    handleSend,
  };
}
