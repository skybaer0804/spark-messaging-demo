import sparkMessagingClient from '@/config/sparkMessaging';

let connectPromise: Promise<unknown> | null = null;

export async function ensureSparkMessagingConnected() {
  const status = sparkMessagingClient.getConnectionStatus();
  if (status.isConnected) return status;

  if (!connectPromise) {
    connectPromise = sparkMessagingClient
      .connect()
      .catch((err: unknown) => {
        // 동시 connect 호출(초기 로드/새로고침/개발환경 effect 2회 등)에서 흔히 발생
        if (err instanceof Error && err.message.includes('Connection already in progress')) {
          return;
        }
        throw err;
      })
      .finally(() => {
        connectPromise = null;
      });
  }

  await connectPromise;
  return sparkMessagingClient.getConnectionStatus();
}


