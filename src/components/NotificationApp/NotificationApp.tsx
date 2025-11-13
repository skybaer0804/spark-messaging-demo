import { useState, useEffect } from 'preact/hooks';
import sparkMessagingClient from '../../config/sparkMessaging';
import './NotificationApp.scss';

export function NotificationApp() {
    const [message, setMessage] = useState('');
    const [scheduleOption, setScheduleOption] = useState<string>('immediate');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const status = sparkMessagingClient.getConnectionStatus();
        setIsConnected(status.isConnected);

        const handleConnectionStateChange = (connected: boolean) => {
            setIsConnected(connected);
        };

        const unsubscribe = sparkMessagingClient.onConnectionStateChange(handleConnectionStateChange);

        return () => {
            unsubscribe();
        };
    }, []);

    const getScheduledTime = (): string => {
        const now = new Date();
        switch (scheduleOption) {
            case '1min':
                return new Date(now.getTime() + 60 * 1000).toISOString();
            case '5min':
                return new Date(now.getTime() + 5 * 60 * 1000).toISOString();
            default:
                return new Date().toISOString();
        }
    };

    const handleSend = async () => {
        if (!message.trim()) {
            alert('알림 메시지를 입력해주세요.');
            return;
        }

        if (!isConnected) {
            alert('서버에 연결되어 있지 않습니다. 연결을 확인해주세요.');
            return;
        }

        try {
            // 알림 데이터를 JSON 문자열로 만들어 content에 포함
            const notificationData = {
                content: message,
                scheduledTime: getScheduledTime(),
                timestamp: Date.now(),
            };

            await sparkMessagingClient.sendMessage('notification', JSON.stringify(notificationData));

            setMessage('');
            setScheduleOption('immediate');
            alert('알림이 전송되었습니다.');
        } catch (error) {
            console.error('알림 전송 실패:', error);
            alert(`알림 전송에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    return (
        <div className="notification-app">
            <div className="notification-app__header">
                <h2>알림 발송</h2>
            </div>
            <div className="notification-app__form">
                <div className="notification-app__field">
                    <label htmlFor="notification-message">알림 메시지</label>
                    <textarea
                        id="notification-message"
                        className="notification-app__textarea"
                        value={message}
                        onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
                        placeholder="알림 메시지를 입력하세요..."
                        rows={5}
                    />
                </div>
                <div className="notification-app__field">
                    <label htmlFor="notification-time">발송 시간</label>
                    <select
                        id="notification-time"
                        className="notification-app__select"
                        value={scheduleOption}
                        onInput={(e) => setScheduleOption((e.target as HTMLSelectElement).value)}
                    >
                        <option value="immediate">즉시</option>
                        <option value="1min">1분 후</option>
                        <option value="5min">5분 후</option>
                    </select>
                </div>
            </div>
            <div className="notification-app__footer">
                <button className="notification-app__button" onClick={handleSend} disabled={!isConnected || !message.trim()}>
                    알림 발송
                </button>
            </div>
        </div>
    );
}
