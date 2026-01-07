const SparkMessaging = require('@skybaer0804/spark-messaging-client');

class SocketService {
    constructor() {
        this.client = null;
    }

    initialize() {
        const serverUrl = process.env.SPARK_SERVER_URL;
        const projectKey = process.env.SPARK_PROJECT_KEY;

        if (!serverUrl || !projectKey) {
            console.error('Spark Messaging configuration missing');
            return;
        }

        this.client = new SparkMessaging(serverUrl, projectKey);
        console.log('Spark Messaging SDK Initialized');
    }

    async sendRoomMessage(roomId, type, content, senderId) {
        if (!this.client) return;

        try {
            // 소켓 서버로 메시지 전송 (브로드캐스트)
            await this.client.sendRoomMessage(roomId, type, {
                content,
                senderId,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to send socket message:', error);
        }
    }

    // 추가적인 소켓 관련 유틸리티 로직 (방 참여 등)을 여기에 구현할 수 있습니다.
}

module.exports = new SocketService();

