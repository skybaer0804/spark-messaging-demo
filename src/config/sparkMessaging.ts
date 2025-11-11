import SparkMessaging from '@skybaer0804/spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

// SDK 생성자 호출 (타입 에러 방지를 위해 any 사용)
const sparkMessagingClient = new (SparkMessaging as any)(serverUrl, projectKey);

export default sparkMessagingClient;
