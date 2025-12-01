import { useNotificationApp } from './hooks/useNotificationApp';
import './NotificationApp.scss';

export function NotificationApp() {
    const { message, setMessage, scheduleOption, setScheduleOption, isConnected, handleSend } = useNotificationApp();

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
                        onInput={(e) => setScheduleOption((e.target as HTMLSelectElement).value as any)}
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
