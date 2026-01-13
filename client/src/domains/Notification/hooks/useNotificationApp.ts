import { useState, useEffect, useRef } from 'preact/hooks';
import { useToast } from '@/core/context/ToastContext';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { NotificationService } from '@/core/socket/NotificationService';
import { workspaceApi, notificationApi } from '@/core/api/ApiService';
import type { Workspace } from '../../Chat/types/ChatRoom';

export interface Notification {
  _id: string;
  title: string;
  content: string;
  scheduledAt?: string;
  targetType: 'all' | 'workspace';
  targetId?: string;
  isSent: boolean;
  createdAt: string;
  senderId: string;
}

export function useNotificationApp() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledAt] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'workspace'>('all');
  const [targetId, setTargetId] = useState('');
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { showSuccess, showError } = useToast();
  const notificationServiceRef = useRef<NotificationService | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      showError('알림 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const connectionService = new ConnectionService(sparkMessagingClient);
    const notificationService = new NotificationService(sparkMessagingClient, connectionService);

    notificationServiceRef.current = notificationService;

    const status = connectionService.getConnectionStatus();
    setIsConnected(status.isConnected);

    connectionService.onConnectionStateChange((connected) => {
      setIsConnected(connected);
    });

    const fetchWorkspaces = async () => {
      try {
        const res = await workspaceApi.getWorkspaces();
        setWorkspaceList(res.data);
        if (res.data.length > 0) setTargetId(res.data[0]._id);
      } catch (err) {
        console.error('Failed to fetch workspaces:', err);
      }
    };

    fetchWorkspaces();
    fetchNotifications();

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
        targetId: targetType === 'workspace' ? targetId : undefined,
      });

      setTitle('');
      setMessage('');
      setScheduledAt('');
      setIsDrawerOpen(false);
      showSuccess('알림이 생성되었습니다.');
      fetchNotifications();
    } catch (error) {
      console.error('Notification creation failed:', error);
      showError('알림 생성에 실패했습니다.');
    }
  };

  const handleResend = async (notification: Notification) => {
    try {
      await notificationApi.createNotification({
        title: notification.title,
        content: notification.content,
        targetType: notification.targetType,
        targetId: notification.targetId,
      });
      showSuccess('알림이 재발송되었습니다.');
      fetchNotifications();
    } catch (error) {
      console.error('Notification resend failed:', error);
      showError('알림 재발송에 실패했습니다.');
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
    workspaceList,
    isConnected,
    handleSend,
    notifications,
    isLoading,
    isDrawerOpen,
    setIsDrawerOpen,
    handleResend,
    fetchNotifications,
  };
}
