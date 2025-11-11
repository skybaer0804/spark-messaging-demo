import { useState, useEffect } from 'preact/hooks';
import sparkMessagingClient from './config/sparkMessaging';
import './app.css';

interface Message {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
}

export function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [roomId, setRoomId] = useState('chat');
    const [socketId, setSocketId] = useState<string | null>(null);

    useEffect(() => {
        console.log('Setting up Spark Messaging client...');
        console.log('Server URL:', import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
        console.log('Project Key:', import.meta.env.VITE_PROJECT_KEY ? '***' : 'default-project-key-12345');

        // 연결 상태 핸들러
        const handleConnected = (data: { socketId: string }) => {
            console.log('✅ Connected event received:', data);
            setIsConnected(true);
            setSocketId(data.socketId);
        };

        // 메시지 수신 핸들러
        const handleMessage = (msg: { content: string; roomId?: string }) => {
            console.log('📨 Message received:', msg);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: msg.content,
                    timestamp: new Date(),
                    type: 'received',
                },
            ]);
        };

        // 에러 핸들러
        const handleError = (error: { message: string }) => {
            console.error('❌ Error:', error);
            setIsConnected(false);
        };

        // 이벤트 리스너 등록
        // SDK가 생성자에서 자동으로 연결을 시작하므로 이벤트 리스너만 등록
        sparkMessagingClient.onConnected(handleConnected);
        sparkMessagingClient.onMessage(handleMessage);
        sparkMessagingClient.onError(handleError);

        console.log('Event listeners registered. Checking connection status...');

        // SDK가 이미 연결되어 있을 수 있으므로 연결 상태 확인
        const checkConnectionStatus = () => {
            const client = sparkMessagingClient as any;

            // 연결 상태 확인 메서드가 있는지 확인
            if (typeof client.isConnected === 'function') {
                const connected = client.isConnected();
                console.log('isConnected() result:', connected);

                if (connected) {
                    // connection 객체 확인
                    if (client.connection) {
                        console.log('Connection object:', client.connection);
                        console.log('Connection properties:', Object.keys(client.connection));

                        // connection 객체에서 socketId 찾기
                        if (client.connection.id) {
                            console.log('✅ Found socketId in connection.id:', client.connection.id);
                            setIsConnected(true);
                            setSocketId(client.connection.id);
                            return;
                        }
                        if (client.connection.socketId) {
                            console.log('✅ Found socketId in connection.socketId:', client.connection.socketId);
                            setIsConnected(true);
                            setSocketId(client.connection.socketId);
                            return;
                        }
                    }

                    // 최상위 레벨에서 socketId 확인
                    if (client.socketId) {
                        console.log('✅ Found socketId:', client.socketId);
                        setIsConnected(true);
                        setSocketId(client.socketId);
                        return;
                    }

                    // 연결은 되어 있지만 socketId를 찾지 못한 경우
                    console.log('✅ Connected but socketId not found. Setting connected state anyway.');
                    setIsConnected(true);
                    setSocketId('connected');
                    return;
                }
            }

            // socketId 속성이 직접 있는지 확인
            if (client.socketId) {
                console.log('✅ Found socketId:', client.socketId);
                setIsConnected(true);
                setSocketId(client.socketId);
                return;
            }

            // connection 객체에서 직접 확인
            if (client.connection) {
                const socketId = client.connection.id || client.connection.socketId;
                if (socketId) {
                    console.log('✅ Found socketId in connection:', socketId);
                    setIsConnected(true);
                    setSocketId(socketId);
                    return;
                }
            }

            console.log('⚠️ Connection status not found. Waiting for onConnected event...');
            console.log('SDK client properties:', Object.keys(client));
        };

        // 짧은 지연 후 연결 상태 확인 (SDK 초기화 시간 고려)
        setTimeout(checkConnectionStatus, 500);

        // 클린업
        return () => {
            console.log('Cleaning up Spark Messaging client...');
            if (typeof sparkMessagingClient.disconnect === 'function') {
                sparkMessagingClient.disconnect();
            }
        };
    }, []);

    const sendMessage = () => {
        if (input.trim() && isConnected) {
            // SDK의 sendMessage API에 맞게 호출
            try {
                sparkMessagingClient.sendMessage(roomId as any, input as any);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        content: input,
                        timestamp: new Date(),
                        type: 'sent',
                    },
                ]);
                setInput('');
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Spark Messaging Demo</h1>
                <div className="status-container">
                    <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
                    <span className="status-text">{isConnected ? `Connected (${socketId?.substring(0, 8)}...)` : 'Disconnected'}</span>
                </div>
            </header>

            <main className="app-main">
                <div className="room-selector">
                    <label htmlFor="roomId">Room ID:</label>
                    <input
                        id="roomId"
                        type="text"
                        value={roomId}
                        onInput={(e) => setRoomId(e.currentTarget.value)}
                        placeholder="Enter room ID"
                        disabled={!isConnected}
                    />
                </div>

                <div className="messages-container">
                    <div className="messages-list">
                        {messages.length === 0 ? (
                            <div className="empty-message">메시지가 없습니다. 메시지를 보내보세요!</div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`message ${msg.type}`}>
                                    <div className="message-content">{msg.content}</div>
                                    <div className="message-time">
                                        {msg.timestamp.toLocaleTimeString('ko-KR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="input-container">
                    <input
                        type="text"
                        value={input}
                        onInput={(e) => setInput(e.currentTarget.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isConnected ? '메시지를 입력하세요...' : '연결 중...'}
                        disabled={!isConnected}
                        className="message-input"
                    />
                    <button onClick={sendMessage} disabled={!isConnected || !input.trim()} className="send-button">
                        전송
                    </button>
                </div>
            </main>
        </div>
    );
}
