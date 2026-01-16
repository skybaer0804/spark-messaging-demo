import { useState, useEffect } from 'preact/hooks';
import { chatApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';

export type NotificationMode = 'default' | 'none' | 'mention';

export interface ChatNotificationSettings {
  notificationMode: NotificationMode;
  notificationEnabled: boolean;
}

export function useChatNotificationSettings(roomId: string | null) {
  const [settings, setSettings] = useState<ChatNotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchSettings = async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      const response = await chatApi.getRoomNotificationSettings(roomId);
      setSettings({
        notificationMode: response.data.notificationMode || 'default',
        notificationEnabled: response.data.notificationEnabled !== false,
      });
    } catch (error: any) {
      console.error('Failed to fetch notification settings:', error);
      // 기본값 설정
      setSettings({
        notificationMode: 'default',
        notificationEnabled: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (mode: NotificationMode) => {
    if (!roomId) return;

    setSaving(true);
    try {
      const response = await chatApi.updateRoomNotificationSettings(roomId, { notificationMode: mode });
      setSettings({
        notificationMode: response.data.notificationMode || 'default',
        notificationEnabled: response.data.notificationEnabled !== false,
      });
      showSuccess('알림 설정이 저장되었습니다.');
      return true;
    } catch (error: any) {
      console.error('Failed to update notification settings:', error);
      showError(error.response?.data?.message || '알림 설정 저장에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    return await updateSettings('default');
  };

  useEffect(() => {
    // roomId가 변경되면 설정 초기화
    setSettings(null);
    if (roomId) {
      fetchSettings();
    }
  }, [roomId]);

  return {
    settings,
    loading,
    saving,
    fetchSettings,
    updateSettings,
    resetSettings,
  };
}
