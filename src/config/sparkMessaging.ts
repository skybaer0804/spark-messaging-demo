import SparkMessaging from '@skybaer0804/spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

// SDK 생성자 호출 (생성자 오버로드 사용)
const sparkMessagingClient = new SparkMessaging(serverUrl, projectKey);

// 또는 옵션 객체로 초기화
// const sparkMessagingClient = new SparkMessaging({
//     serverUrl,
//     projectKey,
//     debug: import.meta.env.DEV, // 개발 환경에서 디버그 모드
//     autoConnect: true,
// });

export default sparkMessagingClient;
