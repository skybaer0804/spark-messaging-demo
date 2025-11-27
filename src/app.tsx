import { useState, useEffect, useRef } from 'preact/hooks';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import sparkMessagingClient from './config/sparkMessaging';
import { Header } from './layouts/Header/Header';
import { Content } from './layouts/Content/Content';
import { ChatApp } from './components/ChatApp/ChatApp';
import { NotificationApp } from './components/NotificationApp/NotificationApp';
import { BottomTab } from './components/BottomTab/BottomTab';
import { Sidebar } from './components/Sidebar/Sidebar';
import './app.scss';
import './index.css';

export function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<string>('chat');
    const socketIdRef = useRef<string | null>(null);

    useEffect(() => {
        // SDK 연결 초기화
        const initializeConnection = async () => {
            try {
                const status = sparkMessagingClient.getConnectionStatus();
                if (!status.isConnected) {
                    await sparkMessagingClient.connect();
                } else {
                    setIsConnected(true);
                    setSocketId(status.socketId);
                    socketIdRef.current = status.socketId;
                }
            } catch (error) {
                console.error('연결 초기화 실패:', error);
            }
        };

        initializeConnection();

        // 연결 상태 핸들러 (이미 연결되어 있으면 즉시 호출됨)
        const handleConnected = (data: any) => {
            setIsConnected(true);
            setSocketId(data.socketId);
            socketIdRef.current = data.socketId;
        };

        // 연결 상태 변경 핸들러
        const handleConnectionStateChange = (connected: boolean) => {
            setIsConnected(connected);
            if (connected) {
                const status = sparkMessagingClient.getConnectionStatus();
                setSocketId(status.socketId);
                socketIdRef.current = status.socketId;
            } else {
                setSocketId(null);
                socketIdRef.current = null;
            }
        };

        // 알림 메시지 수신 핸들러
        const handleNotification = (data: any) => {
            try {
                // notification 타입 메시지 처리
                if (data.type === 'notification') {
                    let notificationData;
                    try {
                        notificationData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
                    } catch {
                        notificationData = { content: data.content };
                    }

                    const notificationMessage = notificationData.content || data.content || '알림이 도착했습니다.';
                    const scheduledTime = notificationData.scheduledTime;

                    // 발송 시간이 설정되어 있고 미래인 경우 스케줄링
                    if (scheduledTime) {
                        const scheduledDate = new Date(scheduledTime);
                        const now = new Date();
                        if (scheduledDate > now) {
                            const delay = scheduledDate.getTime() - now.getTime();
                            setTimeout(() => {
                                showNotification(notificationMessage);
                            }, delay);
                            return;
                        }
                    }

                    // 즉시 표시
                    showNotification(notificationMessage);
                }
            } catch (error) {
                console.error('알림 처리 오류:', error);
            }
        };

        const showNotification = (message: string) => {
            toast.info(message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        };

        const unsubscribeConnected = sparkMessagingClient.onConnected(handleConnected);
        const unsubscribeStateChange = sparkMessagingClient.onConnectionStateChange(handleConnectionStateChange);
        const unsubscribeMessage = sparkMessagingClient.onMessage(handleNotification);

        return () => {
            unsubscribeConnected();
            unsubscribeStateChange();
            unsubscribeMessage();
            // 앱이 언마운트될 때만 연결 해제
            // sparkMessagingClient.disconnect();
        };
    }, []);

    const getHeaderTitle = () => {
        if (currentView === 'chat') {
            return 'Chat';
        }
        if (currentView === 'notification') {
            return 'Notification';
        }
        return 'Spark Messaging Demo';
    };

    const handleTabClick = (view: string) => {
        setCurrentView(view);
    };

    const handleViewChange = (view: string) => {
        setCurrentView(view);
    };

    return (
        <div className="app">
            <Header title={getHeaderTitle()} isConnected={isConnected} socketId={socketId} />
            <div className="app__main">
                <Sidebar currentView={currentView} onViewChange={handleViewChange} />
                <Content>
                    {currentView === 'chat' && <ChatApp />}
                    {currentView === 'notification' && <NotificationApp />}
                </Content>
            </div>
            <BottomTab currentView={currentView} onTabClick={handleTabClick} />
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
}
