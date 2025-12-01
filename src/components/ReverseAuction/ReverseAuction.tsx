import { useReverseAuction } from './hooks/useReverseAuction';
import { formatTimestamp } from '../../utils/messageUtils';
import type { Category } from './types';
import { useRef, useEffect, useMemo } from 'preact/hooks';
import './ReverseAuction.scss';

export function ReverseAuction() {
    const {
        isConnected,
        userRole,
        currentRoom,
        roomList,
        participants,
        chatMessages,
        chatInput,
        setChatInput,
        showCreateForm,
        setShowCreateForm,
        selectedCategory,
        setSelectedCategory,
        roomTitle,
        setRoomTitle,
        pendingRequests,
        joinRequestStatus,
        localStream,
        isVideoEnabled,
        myRooms,
        handleCreateRoom,
        handleJoinRoom,
        handleApproveRequest,
        handleRejectRequest,
        handleLeaveRoom,
        handleSendChat,
        startLocalStream,
        stopLocalStream,
        setVideoRef,
        getSocketId,
    } = useReverseAuction();

    const socketId = getSocketId();
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    // 채팅 메시지가 추가될 때 스크롤 하단으로 이동
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages.length]);

    // 영상 영역 메모이제이션 (채팅 메시지 업데이트 시 리렌더링 방지)
    const videoSection = useMemo(
        () => (
            <div className="reverse-auction__video-section">
                <div className="reverse-auction__video-controls">
                    {!isVideoEnabled ? (
                        <button className="reverse-auction__video-toggle-button" onClick={startLocalStream}>
                            📹 영상 시작
                        </button>
                    ) : (
                        <button className="reverse-auction__video-toggle-button reverse-auction__video-toggle-button--stop" onClick={stopLocalStream}>
                            🛑 영상 중지
                        </button>
                    )}
                </div>
                <div className="reverse-auction__video-grid">
                    {/* 로컬 비디오 (자신) */}
                    {isVideoEnabled && localStream && (
                        <div className="reverse-auction__video-item reverse-auction__video-item--local">
                            <video
                                ref={(el) => {
                                    if (el && socketId) {
                                        setVideoRef('local', el);
                                        el.srcObject = localStream;
                                        el.autoplay = true;
                                        el.playsInline = true;
                                        el.muted = true;
                                    }
                                }}
                                className="reverse-auction__video-element"
                            />
                            <div className="reverse-auction__video-label">나 ({socketId?.substring(0, 6)})</div>
                        </div>
                    )}

                    {/* 원격 비디오 (다른 참가자들) */}
                    {participants
                        .filter((p) => p.socketId !== socketId)
                        .slice(0, 4 - (isVideoEnabled ? 1 : 0))
                        .map((participant) => (
                            <div key={participant.socketId} className="reverse-auction__video-item">
                                <video
                                    ref={(el) => {
                                        setVideoRef(participant.socketId, el);
                                        if (el && participant.stream) {
                                            el.srcObject = participant.stream;
                                            el.autoplay = true;
                                            el.playsInline = true;
                                            el.muted = false;
                                            el.play().catch((error) => {
                                                console.error('[ERROR] 비디오 재생 실패:', error);
                                            });
                                        }
                                    }}
                                    className="reverse-auction__video-element"
                                    style={{ display: participant.stream ? 'block' : 'none' }}
                                />
                                {participant.isVideoEnabled !== false && participant.stream ? (
                                    <div className="reverse-auction__video-label">
                                        {participant.name} ({participant.role === 'demander' ? '수요자' : '공급자'}) - 영상 중
                                    </div>
                                ) : (
                                    <div className="reverse-auction__video-placeholder">
                                        {participant.name}
                                        <br />
                                        <small>{participant.role === 'demander' ? '수요자' : '공급자'}</small>
                                        <br />
                                        <small className="reverse-auction__video-loading">
                                            {participant.isVideoEnabled === false ? '영상 중지' : '연결 중...'}
                                        </small>
                                    </div>
                                )}
                            </div>
                        ))}

                    {/* 빈 슬롯 */}
                    {participants.length === 0 && !isVideoEnabled && (
                        <div className="reverse-auction__video-placeholder">영상 영역 (영상 시작 버튼을 눌러주세요)</div>
                    )}
                </div>
            </div>
        ),
        [isVideoEnabled, localStream, participants, socketId, setVideoRef, startLocalStream, stopLocalStream]
    );

    // 초기 화면 (랜딩)
    if (!currentRoom) {
        return (
            <div className="reverse-auction">
                <div className="reverse-auction__header">
                    <h2 className="reverse-auction__title">역경매</h2>
                    {!showCreateForm && (
                        <button className="reverse-auction__create-button" onClick={() => setShowCreateForm(true)} disabled={!isConnected}>
                            🏠 룸 생성 (수요자)
                        </button>
                    )}
                </div>

                {showCreateForm ? (
                    <div className="reverse-auction__create-form">
                        <div className="reverse-auction__form-field">
                            <label className="reverse-auction__label">카테고리</label>
                            <div className="reverse-auction__category-tabs">
                                {(['인테리어', '웹개발', '피규어'] as Category[]).map((cat) => (
                                    <button
                                        key={cat}
                                        className={`reverse-auction__category-tab ${selectedCategory === cat ? 'reverse-auction__category-tab--active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="reverse-auction__form-field">
                            <label className="reverse-auction__label">제목</label>
                            <input
                                type="text"
                                className="reverse-auction__input"
                                value={roomTitle}
                                onInput={(e) => setRoomTitle(e.currentTarget.value)}
                                placeholder="예: 3평 원룸 인테리어 견적 요청"
                                disabled={!isConnected}
                            />
                        </div>
                        <div className="reverse-auction__form-actions">
                            <button
                                className="reverse-auction__button reverse-auction__button--secondary"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setRoomTitle('');
                                }}
                            >
                                취소
                            </button>
                            <button
                                className="reverse-auction__button reverse-auction__button--primary"
                                onClick={handleCreateRoom}
                                disabled={!isConnected || !roomTitle.trim()}
                            >
                                생성
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="reverse-auction__room-list">
                        <div className="reverse-auction__room-list-header">
                            <h3 className="reverse-auction__room-list-title">룸 리스트</h3>
                        </div>
                        <div className="reverse-auction__room-list-content">
                            {roomList.length === 0 ? (
                                <div className="reverse-auction__empty">{!isConnected ? <p>서버에 연결 중...</p> : <p>생성된 룸이 없습니다.</p>}</div>
                            ) : (
                                <div className="reverse-auction__room-items">
                                    {roomList.map((room) => (
                                        <div key={room.roomId} className="reverse-auction__room-item">
                                            <div className="reverse-auction__room-item-info">
                                                <span className="reverse-auction__room-item-category">{room.category}</span>
                                                <h4 className="reverse-auction__room-item-title">{room.title}</h4>
                                                <p className="reverse-auction__room-item-meta">참가자: {room.participants}명</p>
                                            </div>
                                            <button
                                                className="reverse-auction__room-item-button"
                                                onClick={() => handleJoinRoom(room)}
                                                disabled={
                                                    !isConnected ||
                                                    (joinRequestStatus === 'pending' && !myRooms.has(room.roomId)) ||
                                                    (joinRequestStatus === 'approved' && !myRooms.has(room.roomId))
                                                }
                                            >
                                                {myRooms.has(room.roomId)
                                                    ? '내 룸'
                                                    : joinRequestStatus === 'approved'
                                                    ? '승인됨 - 입장 중...'
                                                    : joinRequestStatus === 'pending'
                                                    ? '대기 중...'
                                                    : joinRequestStatus === 'rejected'
                                                    ? '거부됨 - 다시 참가'
                                                    : '참가'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 룸 상세 화면
    return (
        <div className="reverse-auction">
            <div className="reverse-auction__room-header">
                <button className="reverse-auction__back-button" onClick={handleLeaveRoom}>
                    ←
                </button>
                <div className="reverse-auction__room-header-info">
                    <h2 className="reverse-auction__room-title">{currentRoom.title}</h2>
                    <span className="reverse-auction__room-category">{currentRoom.category}</span>
                </div>
            </div>

            {/* 참가 요청 알림 (수요자만) */}
            {userRole === 'demander' && pendingRequests.length > 0 && (
                <div className="reverse-auction__pending-requests">
                    <h4>참가 요청</h4>
                    {pendingRequests.map((request) => (
                        <div key={request.socketId} className="reverse-auction__request-item">
                            <span>{request.name}</span>
                            <div className="reverse-auction__request-actions">
                                <button className="reverse-auction__approve-button" onClick={() => handleApproveRequest(request.socketId)}>
                                    승인
                                </button>
                                <button className="reverse-auction__reject-button" onClick={() => handleRejectRequest(request.socketId)}>
                                    거부
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 영상과 채팅 영역 (Grid 레이아웃) */}
            <div className="reverse-auction__main-content">
                {/* 영상 영역 */}
                {videoSection}

                {/* 채팅 영역 */}
                <div className="reverse-auction__chat-section">
                    <div className="reverse-auction__chat-messages" ref={chatMessagesRef}>
                        {chatMessages.length === 0 ? (
                            <div className="reverse-auction__chat-empty">메시지가 없습니다.</div>
                        ) : (
                            chatMessages.map((msg) => (
                                <div key={msg.id} className={`reverse-auction__chat-message reverse-auction__chat-message--${msg.type}`}>
                                    <div className="reverse-auction__chat-message-header">
                                        <span className="reverse-auction__chat-message-sender">
                                            {msg.senderId ? msg.senderId.substring(0, 6) : '알 수 없음'}
                                        </span>
                                        <span className="reverse-auction__chat-message-time">{formatTimestamp(msg.timestamp)}</span>
                                    </div>
                                    <div className="reverse-auction__chat-message-content">{msg.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="reverse-auction__chat-input-container">
                        <input
                            type="text"
                            className="reverse-auction__chat-input"
                            value={chatInput}
                            onInput={(e) => setChatInput(e.currentTarget.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendChat();
                                }
                            }}
                            placeholder="메시지를 입력하세요..."
                            disabled={!isConnected}
                        />
                        <button className="reverse-auction__chat-send-button" onClick={handleSendChat} disabled={!isConnected || !chatInput.trim()}>
                            전송
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
