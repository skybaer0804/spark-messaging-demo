import { pushApi } from './ApiService';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export class PushService {
  private static registrationInProgress = false;

  static async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;

    if (this.registrationInProgress) {
      console.log('Service Worker registration already in progress...');
      return null;
    }

    try {
      this.registrationInProgress = true;

      // 이미 등록된 워커가 있는지 확인
      let registration = await navigator.serviceWorker.getRegistration('/');

      if (!registration) {
        console.log('No Service Worker found, waiting for ready...');
        // vite-plugin-pwa가 등록할 때까지 대기
        registration = await navigator.serviceWorker.ready;
      }

      if (registration) {
        console.log('Service Worker is ready:', registration.scope);
        return registration;
      }

      return null;
    } catch (error) {
      console.error('Service Worker registration check failed:', error);
      return null;
    } finally {
      this.registrationInProgress = false;
    }
  }

  static async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;

      // 기존 구독 확인
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // 새 구독 생성
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // 기기 고유 ID 생성 또는 가져오기
      let deviceId = localStorage.getItem('spark_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('spark_device_id', deviceId);
      }

      // 서버에 구독 정보와 deviceId 전송
      await pushApi.subscribe({
        subscription,
        deviceId,
      });
      console.log('User is subscribed to Push Notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  static async unsubscribeFromPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      const deviceId = localStorage.getItem('spark_device_id');
      await pushApi.unsubscribe(deviceId);

      console.log('User is unsubscribed from Push Notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  private static urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
