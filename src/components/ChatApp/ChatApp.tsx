import { useChatApp } from './hooks/useChatApp';
import { formatTimestamp } from '../../utils/messageUtils';
import { formatFileSize, getFileIcon, downloadFile } from '../../utils/fileUtils';
import { useRef, useEffect, useState } from 'preact/hooks';
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
        sendFile,
        uploadingFile,
        uploadProgress,
    } = useChatApp();

    const messagesRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imageModal, setImageModal] = useState<{ url: string; fileName: string } | null>(null);

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

    const handleFileSelect = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        if (files.length > 0) {
            setSelectedFiles((prev) => [...prev, ...files]);
        }
        // 같은 파일을 다시 선택할 수 있도록 input 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSend = async () => {
        if (selectedFiles.length > 0) {
            // 모든 파일을 순차적으로 전송
            for (const file of selectedFiles) {
                await sendFile(file);
            }
            setSelectedFiles([]);
        }
    };

    const handleFileRemove = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleImageClick = (imageUrl: string, fileName: string) => {
        setImageModal({ url: imageUrl, fileName });
    };

    const handleCloseImageModal = () => {
        setImageModal(null);
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
                                    {msg.fileData ? (
                                        <div className="chat-app__message-file">
                                            {msg.fileData.fileType === 'image' ? (
                                                <div className="chat-app__message-image-wrapper">
                                                    <img
                                                        src={msg.fileData.data}
                                                        alt={msg.fileData.fileName}
                                                        className="chat-app__message-image"
                                                        onClick={() => handleImageClick(msg.fileData!.data, msg.fileData!.fileName)}
                                                    />
                                                    <button
                                                        className="chat-app__message-image-download"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadFile(msg.fileData!.fileName, msg.fileData!.data, msg.fileData!.mimeType);
                                                        }}
                                                        title="다운로드"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                            <polyline points="7 10 12 15 17 10"></polyline>
                                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="chat-app__message-document">
                                                    <div className="chat-app__message-document-icon">{getFileIcon(msg.fileData.mimeType)}</div>
                                                    <div className="chat-app__message-document-info">
                                                        <div className="chat-app__message-document-name">{msg.fileData.fileName}</div>
                                                        <div className="chat-app__message-document-size">{formatFileSize(msg.fileData.size)}</div>
                                                    </div>
                                                    <button
                                                        className="chat-app__message-document-download"
                                                        onClick={() => downloadFile(msg.fileData!.fileName, msg.fileData!.data, msg.fileData!.mimeType)}
                                                        title="다운로드"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                            <polyline points="7 10 12 15 17 10"></polyline>
                                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="chat-app__message-content">{msg.content}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="chat-app__input-container">
                        {selectedFiles.length > 0 && (
                            <div className="chat-app__file-preview">
                                {selectedFiles.map((file: File, index: number) => (
                                    <div key={index} className="chat-app__file-preview-item">
                                        <span className="chat-app__file-preview-icon">{getFileIcon(file.type)}</span>
                                        <span className="chat-app__file-preview-name">{file.name}</span>
                                        <span className="chat-app__file-preview-size">{formatFileSize(file.size)}</span>
                                        <button className="chat-app__file-remove" onClick={() => handleFileRemove(index)}>
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {uploadingFile && (
                                    <div className="chat-app__progress-container">
                                        <div className="chat-app__progress-bar">
                                            <div className="chat-app__progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <span className="chat-app__progress-text">{Math.round(uploadProgress)}% 전송 중...</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="chat-app__input-wrapper">
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="chat-app__file-input"
                                onChange={handleFileSelect}
                                accept="image/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf"
                                multiple
                                style={{ display: 'none' }}
                            />
                            <button className="chat-app__file-button" onClick={() => fileInputRef.current?.click()} disabled={!isConnected} title="파일 첨부">
                                📎
                            </button>
                            <input
                                type="text"
                                className="chat-app__input"
                                value={input}
                                onInput={(e) => setInput(e.currentTarget.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={!isConnected ? '연결 중...' : `${currentRoom} Room에 메시지를 입력하세요...`}
                                disabled={!isConnected}
                            />
                            <button
                                onClick={selectedFiles.length > 0 ? handleFileSend : sendMessage}
                                disabled={!isConnected || (!input.trim() && selectedFiles.length === 0)}
                                className="chat-app__send-button"
                            >
                                전송
                            </button>
                        </div>
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
            {imageModal && (
                <div className="chat-app__image-modal" onClick={handleCloseImageModal}>
                    <div className="chat-app__image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="chat-app__image-modal-close" onClick={handleCloseImageModal}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={imageModal.url} alt={imageModal.fileName} className="chat-app__image-modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
}
