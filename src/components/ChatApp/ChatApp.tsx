import { useChatApp } from './hooks/useChatApp';
import { formatTimestamp } from '../../utils/messageUtils';
import { useRef, useEffect } from 'preact/hooks';
import './ChatApp.scss';

export function ChatApp() {
    const {
        isConnected,
        messages,
        input,
        setInput,
        roomIdInput,
        setRoomIdInput,
        currentRoom,
        roomList,
        sendMessage,
        handleRoomSelect,
        handleCreateRoom,
        leaveRoom,
    } = useChatApp();

    const messagesRef = useRef<HTMLDivElement>(null);

    // 채팅 메시지가 추가될 때 스크롤 하단으로 이동
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages.length, currentRoom]);

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // 채팅방 목록 화면
    if (!currentRoom) {
        return (
            <div className="chat-app">
                <div className="chat-app__room-list">
                    <div className="chat-app__room-list-header">
                        <h2 className="chat-app__room-list-title">채팅방 목록</h2>
                        <div className="chat-app__room-create">
                            <input
                                type="text"
                                className="chat-app__room-create-input"
                                value={roomIdInput}
                                onInput={(e) => setRoomIdInput(e.currentTarget.value)}
                                placeholder="새 채팅방 이름"
                                disabled={!isConnected}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateRoom();
                                    }
                                }}
                            />
                            <button onClick={handleCreateRoom} disabled={!isConnected || !roomIdInput.trim()} className="chat-app__room-create-button">
                                만들기
                            </button>
                        </div>
                    </div>
                    <div className="chat-app__room-list-content">
                        {roomList.length === 0 ? (
                            <div className="chat-app__room-list-empty">
                                {!isConnected ? (
                                    <p>서버에 연결 중...</p>
                                ) : (
                                    <>
                                        <p>생성된 채팅방이 없습니다.</p>
                                        <p className="chat-app__room-list-empty-hint">위에서 새 채팅방을 만들어보세요!</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="chat-app__room-list-items">
                                {roomList.map((room) => (
                                    <button key={room} className="chat-app__room-list-item" onClick={() => handleRoomSelect(room)}>
                                        <div className="chat-app__room-list-item-name">
                                            {room}
                                            {currentRoom === room && <span className="chat-app__room-list-item-badge">참여 중</span>}
                                        </div>
                                        <div className="chat-app__room-list-item-arrow">→</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 채팅창 화면
    return (
        <div className="chat-app">
            <div className="chat-app__chat-header">
                <button className="chat-app__back-button" onClick={leaveRoom}>
                    ←
                </button>
                <h2 className="chat-app__chat-title">{currentRoom}</h2>
            </div>

            <div className="chat-app__main-content">
                {/* 채팅 영역 */}
                <div className="chat-app__chat-section">
                    <div className="chat-app__messages-list" ref={messagesRef}>
                        {messages.length === 0 ? (
                            <div className="chat-app__empty-message">{currentRoom} Room에 메시지가 없습니다. 메시지를 보내보세요!</div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`chat-app__message chat-app__message--${msg.type}`}>
                                    <div className="chat-app__message-header">
                                        <span className="chat-app__message-sender">{msg.senderId ? msg.senderId.substring(0, 6) : '알 수 없음'}</span>
                                        <span className="chat-app__message-time">{formatTimestamp(msg.timestamp)}</span>
                                    </div>
                                    <div className="chat-app__message-content">{msg.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="chat-app__input-container">
                        <input
                            type="text"
                            className="chat-app__input"
                            value={input}
                            onInput={(e) => setInput(e.currentTarget.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={!isConnected ? '연결 중...' : `${currentRoom} Room에 메시지를 입력하세요...`}
                            disabled={!isConnected}
                        />
                        <button onClick={sendMessage} disabled={!isConnected || !input.trim()} className="chat-app__send-button">
                            전송
                        </button>
                    </div>
                </div>

                {/* 우측 룸 목록 사이드바 */}
                <div className="chat-app__sidebar">
                    <div className="chat-app__sidebar-header">
                        <h3 className="chat-app__sidebar-title">채팅방 목록</h3>
                        <div className="chat-app__sidebar-create">
                            <input
                                type="text"
                                className="chat-app__sidebar-create-input"
                                value={roomIdInput}
                                onInput={(e) => setRoomIdInput(e.currentTarget.value)}
                                placeholder="새 채팅방"
                                disabled={!isConnected}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateRoom();
                                    }
                                }}
                            />
                            <button onClick={handleCreateRoom} disabled={!isConnected || !roomIdInput.trim()} className="chat-app__sidebar-create-button">
                                만들기
                            </button>
                        </div>
                    </div>
                    <div className="chat-app__sidebar-content">
                        {roomList.length === 0 ? (
                            <div className="chat-app__sidebar-empty">{!isConnected ? <p>서버에 연결 중...</p> : <p>생성된 채팅방이 없습니다.</p>}</div>
                        ) : (
                            <div className="chat-app__sidebar-items">
                                {roomList.map((room) => (
                                    <button
                                        key={room}
                                        className={`chat-app__sidebar-item ${currentRoom === room ? 'chat-app__sidebar-item--active' : ''}`}
                                        onClick={() => handleRoomSelect(room)}
                                    >
                                        <div className="chat-app__sidebar-item-name">
                                            {room}
                                            {currentRoom === room && <span className="chat-app__sidebar-item-badge">참여 중</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
